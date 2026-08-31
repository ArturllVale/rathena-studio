import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import {
  createEffectiveRandomOption,
  createEffectiveRandomOptionGroup,
  EffectiveRandomOption,
  EffectiveRandomOptionGroup,
} from '../../../domain/database/randomOpt/effectiveRandomOpt';
import {
  RandomOptionDatabaseFile,
  RandomOptionGroupDatabaseFile,
} from '../../../domain/database/randomOpt/randomOptDatabase';
import {
  RandomOptionRawFields,
  RandomOptionGroupRawFields,
} from '../../../domain/database/randomOpt/randomOptTypes';
import { FieldOrigin } from '../../../domain/database/item/effectiveItem';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RegisteredRandomOptLayerData {
  readonly layer: DatabaseLayer;
  readonly file: RandomOptionDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export interface RegisteredRandomOptGroupLayerData {
  readonly layer: DatabaseLayer;
  readonly file: RandomOptionGroupDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredRandomOptRepository {
  private readonly variant: DatabaseVariant;
  private readonly optLayers: Map<string, RegisteredRandomOptLayerData> = new Map();
  private readonly grpLayers: Map<string, RegisteredRandomOptGroupLayerData> = new Map();

  private effectiveOptions: Map<number, EffectiveRandomOption> = new Map();
  private optionNameToId: Map<string, number> = new Map();

  private effectiveGroups: Map<number, EffectiveRandomOptionGroup> = new Map();
  private groupNameToId: Map<string, number> = new Map();

  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addOptionLayer(layerData: RegisteredRandomOptLayerData): void {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, this.variant)) {
      throw new Error(
        `Cannot add layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) into repository context for ${this.variant}.`
      );
    }
    this.optLayers.set(layerData.layer.id, layerData);
    this.isDirty = true;
  }

  public addGroupLayer(layerData: RegisteredRandomOptGroupLayerData): void {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, this.variant)) {
      throw new Error(
        `Cannot add layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) into repository context for ${this.variant}.`
      );
    }
    this.grpLayers.set(layerData.layer.id, layerData);
    this.isDirty = true;
  }

  public getOptionLayer(layerId: string): RegisteredRandomOptLayerData | undefined {
    return this.optLayers.get(layerId);
  }

  public getGroupLayer(layerId: string): RegisteredRandomOptGroupLayerData | undefined {
    return this.grpLayers.get(layerId);
  }

  public getAllOptionLayers(): readonly RegisteredRandomOptLayerData[] {
    return Array.from(this.optLayers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public getAllGroupLayers(): readonly RegisteredRandomOptGroupLayerData[] {
    return Array.from(this.grpLayers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findOptionById(id: number): EffectiveRandomOption | undefined {
    this.ensureResolved();
    return this.effectiveOptions.get(id);
  }

  public findOptionByName(name: string): EffectiveRandomOption | undefined {
    this.ensureResolved();
    const id = this.optionNameToId.get(name.trim().toLowerCase());
    return id !== undefined ? this.effectiveOptions.get(id) : undefined;
  }

  public getAllEffectiveOptions(): readonly EffectiveRandomOption[] {
    this.ensureResolved();
    return Array.from(this.effectiveOptions.values());
  }

  public findGroupById(id: number): EffectiveRandomOptionGroup | undefined {
    this.ensureResolved();
    return this.effectiveGroups.get(id);
  }

  public findGroupByName(name: string): EffectiveRandomOptionGroup | undefined {
    this.ensureResolved();
    const id = this.groupNameToId.get(name.trim().toLowerCase());
    return id !== undefined ? this.effectiveGroups.get(id) : undefined;
  }

  public getAllEffectiveGroups(): readonly EffectiveRandomOptionGroup[] {
    this.ensureResolved();
    return Array.from(this.effectiveGroups.values());
  }

  public invalidate(): void {
    this.isDirty = true;
  }

  private ensureResolved(): void {
    if (!this.isDirty) {
      return;
    }

    this.effectiveOptions.clear();
    this.optionNameToId.clear();
    this.effectiveGroups.clear();
    this.groupNameToId.clear();

    // 1. Resolve Options
    interface OptionBuildState {
      id: number;
      option: string;
      fields: RandomOptionRawFields;
      fieldOrigins: Record<string, FieldOrigin>;
      layerProvenance: string[];
    }
    const optStateMap = new Map<number, OptionBuildState>();

    for (const layerData of this.getAllOptionLayers()) {
      if (layerData.file.header.clear) {
        optStateMap.clear();
      }

      for (const srcOpt of layerData.file.options) {
        const id = srcOpt.id;
        let state = optStateMap.get(id);
        if (!state) {
          state = {
            id,
            option: srcOpt.option,
            fields: { Id: id, Option: srcOpt.option },
            fieldOrigins: {},
            layerProvenance: [layerData.layer.id],
          };
          optStateMap.set(id, state);
        } else {
          if (!state.layerProvenance.includes(layerData.layer.id)) {
            state.layerProvenance.push(layerData.layer.id);
          }
        }

        for (const fieldKey of srcOpt.presentKeys) {
          const val = srcOpt.fields[fieldKey];
          (state.fields as unknown as Record<string, unknown>)[fieldKey] = val;

          state.fieldOrigins[fieldKey] = {
            layerId: layerData.layer.id,
            filePath: layerData.layer.relativePath,
            layerVariant: layerData.layer.variant,
            value: val,
            range: srcOpt.fieldRanges[fieldKey],
          };
        }
      }
    }

    for (const [id, state] of optStateMap.entries()) {
      const effective = createEffectiveRandomOption({
        id,
        option: state.option,
        databaseVariant: this.variant,
        fields: state.fields,
        fieldOrigins: state.fieldOrigins,
        layerProvenance: state.layerProvenance,
      });

      this.effectiveOptions.set(id, effective);
      if (effective.fields.Option) {
        this.optionNameToId.set(effective.fields.Option.trim().toLowerCase(), id);
      }
    }

    // 2. Resolve Option Groups
    interface GroupBuildState {
      id: number;
      group: string;
      fields: RandomOptionGroupRawFields;
      fieldOrigins: Record<string, FieldOrigin>;
      layerProvenance: string[];
    }
    const grpStateMap = new Map<number, GroupBuildState>();

    for (const layerData of this.getAllGroupLayers()) {
      if (layerData.file.header.clear) {
        grpStateMap.clear();
      }

      for (const srcGrp of layerData.file.groups) {
        const id = srcGrp.id;
        let state = grpStateMap.get(id);
        if (!state) {
          state = {
            id,
            group: srcGrp.group,
            fields: { Id: id, Group: srcGrp.group, Slots: [] },
            fieldOrigins: {},
            layerProvenance: [layerData.layer.id],
          };
          grpStateMap.set(id, state);
        } else {
          if (!state.layerProvenance.includes(layerData.layer.id)) {
            state.layerProvenance.push(layerData.layer.id);
          }
        }

        for (const fieldKey of srcGrp.presentKeys) {
          const val = srcGrp.fields[fieldKey];
          (state.fields as unknown as Record<string, unknown>)[fieldKey] = val;

          state.fieldOrigins[fieldKey] = {
            layerId: layerData.layer.id,
            filePath: layerData.layer.relativePath,
            layerVariant: layerData.layer.variant,
            value: val,
            range: srcGrp.fieldRanges[fieldKey],
          };
        }
      }
    }

    for (const [id, state] of grpStateMap.entries()) {
      const effective = createEffectiveRandomOptionGroup({
        id,
        group: state.group,
        databaseVariant: this.variant,
        fields: state.fields,
        fieldOrigins: state.fieldOrigins,
        layerProvenance: state.layerProvenance,
      });

      this.effectiveGroups.set(id, effective);
      if (effective.fields.Group) {
        this.groupNameToId.set(effective.fields.Group.trim().toLowerCase(), id);
      }
    }

    this.isDirty = false;
  }
}
