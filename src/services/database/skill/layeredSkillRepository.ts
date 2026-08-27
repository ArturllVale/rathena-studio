import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { createEffectiveSkill, EffectiveSkill, SkillFieldOrigin } from '../../../domain/database/skill/effectiveSkill';
import { SkillDatabaseFile } from '../../../domain/database/skill/skillDatabase';
import { SkillRawFields } from '../../../domain/database/skill/skillTypes';
import { SourceSkill } from '../../../domain/database/skill/sourceSkill';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RegisteredSkillLayerData {
  readonly layer: DatabaseLayer;
  readonly file: SkillDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredSkillRepository {
  private readonly variant: DatabaseVariant;
  private readonly layers: Map<string, RegisteredSkillLayerData> = new Map();
  private effectiveSkills: Map<number, EffectiveSkill> = new Map();
  private nameToId: Map<string, number> = new Map();
  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addLayer(layerData: RegisteredSkillLayerData): void {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, this.variant)) {
      throw new Error(
        `Cannot add layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) into repository context for ${this.variant}.`
      );
    }

    this.layers.set(layerData.layer.id, layerData);
    this.isDirty = true;
  }

  public removeLayer(layerId: string): boolean {
    const removed = this.layers.delete(layerId);
    if (removed) {
      this.isDirty = true;
    }
    return removed;
  }

  public getLayer(layerId: string): RegisteredSkillLayerData | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): readonly RegisteredSkillLayerData[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findById(id: number): EffectiveSkill | undefined {
    this.ensureResolved();
    return this.effectiveSkills.get(id);
  }

  public findByName(name: string): EffectiveSkill | undefined {
    this.ensureResolved();
    const id = this.nameToId.get(name.trim().toLowerCase());
    return id !== undefined ? this.effectiveSkills.get(id) : undefined;
  }

  public getAllEffectiveSkills(): readonly EffectiveSkill[] {
    this.ensureResolved();
    return Array.from(this.effectiveSkills.values());
  }

  public findSourceSkills(id: number): readonly SourceSkill[] {
    const results: SourceSkill[] = [];
    for (const layerData of this.getAllLayers()) {
      const found = layerData.file.skills.get(id);
      if (found) {
        results.push(found);
      }
    }
    return results;
  }

  public invalidate(): void {
    this.isDirty = true;
  }

  private ensureResolved(): void {
    if (!this.isDirty) {
      return;
    }

    this.effectiveSkills.clear();
    this.nameToId.clear();

    const sortedLayers = this.getAllLayers();

    interface SkillBuildState {
      fields: SkillRawFields;
      fieldOrigins: Record<string, SkillFieldOrigin>;
      layerProvenance: string[];
    }

    const stateMap = new Map<number, SkillBuildState>();

    for (const layerData of sortedLayers) {
      const { layer, file } = layerData;

      for (const sourceSkill of file.skills.values()) {
        const id = sourceSkill.id;
        let skillState = stateMap.get(id);

        if (!skillState) {
          skillState = {
            fields: {
              Id: id,
              Name: sourceSkill.name || `SKILL_${id}`,
            },
            fieldOrigins: {},
            layerProvenance: [],
          };
          stateMap.set(id, skillState);
        }

        if (!skillState.layerProvenance.includes(layer.id)) {
          skillState.layerProvenance.push(layer.id);
        }

        // Merge fields present in this layer
        for (const key of sourceSkill.presentKeys) {
          const val = sourceSkill.fields[key];

          // Complex dictionary merging for Flags, DamageFlags, Requires, Unit
          if (key === 'Flags' && val && typeof val === 'object') {
            skillState.fields.Flags = {
              ...(skillState.fields.Flags || {}),
              ...(val as Record<string, boolean>),
            };
          } else if (key === 'DamageFlags' && val && typeof val === 'object') {
            skillState.fields.DamageFlags = {
              ...(skillState.fields.DamageFlags || {}),
              ...(val as Record<string, boolean>),
            };
          } else if (key === 'Requires' && val && typeof val === 'object') {
            skillState.fields.Requires = {
              ...(skillState.fields.Requires || {}),
              ...(val as Record<string, unknown>),
            };
          } else if (key === 'Unit' && val && typeof val === 'object') {
            skillState.fields.Unit = {
              ...(skillState.fields.Unit || {}),
              ...(val as Record<string, unknown>),
            };
          } else {
            (skillState.fields as unknown as Record<string, unknown>)[key] = val;
          }

          skillState.fieldOrigins[key] = {
            layerId: layer.id,
            filePath: layer.relativePath,
            layerVariant: layer.variant,
            value: val,
            range: sourceSkill.fieldRanges[key],
          };
        }
      }
    }

    // Build final EffectiveSkills
    for (const [id, skillState] of stateMap.entries()) {
      const effectiveSkill = createEffectiveSkill({
        id,
        name: skillState.fields.Name,
        databaseVariant: this.variant,
        fields: skillState.fields,
        fieldOrigins: skillState.fieldOrigins,
        layerProvenance: skillState.layerProvenance,
      });

      this.effectiveSkills.set(id, effectiveSkill);

      if (effectiveSkill.name) {
        this.nameToId.set(effectiveSkill.name.trim().toLowerCase(), id);
      }
    }

    this.isDirty = false;
  }
}
