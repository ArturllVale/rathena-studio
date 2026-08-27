import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { createEffectiveMob, EffectiveMob, MobFieldOrigin } from '../../../domain/database/mob/effectiveMob';
import { MobDatabaseFile } from '../../../domain/database/mob/mobDatabase';
import { MobRawFields } from '../../../domain/database/mob/mobTypes';
import { SourceMob } from '../../../domain/database/mob/sourceMob';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RegisteredMobLayerData {
  readonly layer: DatabaseLayer;
  readonly file: MobDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredMobRepository {
  private readonly variant: DatabaseVariant;
  private readonly layers: Map<string, RegisteredMobLayerData> = new Map();
  private effectiveMobs: Map<number, EffectiveMob> = new Map();
  private aegisNameToId: Map<string, number> = new Map();
  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addLayer(layerData: RegisteredMobLayerData): void {
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

  public getLayer(layerId: string): RegisteredMobLayerData | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): readonly RegisteredMobLayerData[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findById(id: number): EffectiveMob | undefined {
    this.ensureResolved();
    return this.effectiveMobs.get(id);
  }

  public findByAegisName(aegisName: string): EffectiveMob | undefined {
    this.ensureResolved();
    const id = this.aegisNameToId.get(aegisName.trim().toLowerCase());
    return id !== undefined ? this.effectiveMobs.get(id) : undefined;
  }

  public getAllEffectiveMobs(): readonly EffectiveMob[] {
    this.ensureResolved();
    return Array.from(this.effectiveMobs.values());
  }

  public findSourceMobs(id: number): readonly SourceMob[] {
    const results: SourceMob[] = [];
    for (const layerData of this.getAllLayers()) {
      const found = layerData.file.mobs.get(id);
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

    this.effectiveMobs.clear();
    this.aegisNameToId.clear();

    const sortedLayers = this.getAllLayers();

    interface MobBuildState {
      fields: MobRawFields;
      fieldOrigins: Record<string, MobFieldOrigin>;
      layerProvenance: string[];
    }

    const stateMap = new Map<number, MobBuildState>();

    for (const layerData of sortedLayers) {
      const { layer, file } = layerData;

      for (const sourceMob of file.mobs.values()) {
        const id = sourceMob.id;
        let mobState = stateMap.get(id);

        if (!mobState) {
          mobState = {
            fields: {
              Id: id,
              AegisName: '',
              Name: '',
            },
            fieldOrigins: {},
            layerProvenance: [],
          };
          stateMap.set(id, mobState);
        }

        if (!mobState.layerProvenance.includes(layer.id)) {
          mobState.layerProvenance.push(layer.id);
        }

        // Merge fields present in this layer
        for (const key of sourceMob.presentKeys) {
          const val = sourceMob.fields[key];

          // Complex dictionary merging for Modes & RaceGroups
          if (key === 'Modes' && val && typeof val === 'object') {
            mobState.fields.Modes = {
              ...(mobState.fields.Modes || {}),
              ...(val as Record<string, boolean>),
            };
          } else if (key === 'RaceGroups' && val && typeof val === 'object') {
            mobState.fields.RaceGroups = {
              ...(mobState.fields.RaceGroups || {}),
              ...(val as Record<string, boolean>),
            };
          } else {
            (mobState.fields as unknown as Record<string, unknown>)[key] = val;
          }

          mobState.fieldOrigins[key] = {
            layerId: layer.id,
            filePath: layer.relativePath,
            layerVariant: layer.variant,
            value: val,
            range: sourceMob.fieldRanges[key],
          };
        }
      }
    }

    // Build final EffectiveMobs
    for (const [id, mobState] of stateMap.entries()) {
      const effectiveMob = createEffectiveMob({
        id,
        databaseVariant: this.variant,
        fields: mobState.fields,
        fieldOrigins: mobState.fieldOrigins,
        layerProvenance: mobState.layerProvenance,
      });

      this.effectiveMobs.set(id, effectiveMob);

      if (effectiveMob.fields.AegisName) {
        this.aegisNameToId.set(effectiveMob.fields.AegisName.trim().toLowerCase(), id);
      }
    }

    this.isDirty = false;
  }
}
