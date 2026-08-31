import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { createEffectiveItemGroup, EffectiveItemGroup } from '../../../domain/database/itemGroup/effectiveItemGroup';
import { ItemGroupDatabaseFile } from '../../../domain/database/itemGroup/itemGroupDatabase';
import {
  ItemGroupRawFields,
  normalizeItemGroupKey,
  getItemGroupAllEntries,
} from '../../../domain/database/itemGroup/itemGroupTypes';
import { SourceItemGroup } from '../../../domain/database/itemGroup/sourceItemGroup';
import { FieldOrigin } from '../../../domain/database/item/effectiveItem';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RegisteredItemGroupLayerData {
  readonly layer: DatabaseLayer;
  readonly file: ItemGroupDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredItemGroupRepository {
  private readonly variant: DatabaseVariant;
  private readonly layers: Map<string, RegisteredItemGroupLayerData> = new Map();
  private effectiveGroups: Map<string, EffectiveItemGroup> = new Map();
  private itemToGroupKeys: Map<string, Set<string>> = new Map();
  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addLayer(layerData: RegisteredItemGroupLayerData): void {
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

  public getLayer(layerId: string): RegisteredItemGroupLayerData | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): readonly RegisteredItemGroupLayerData[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findByKey(key: string): EffectiveItemGroup | undefined {
    this.ensureResolved();
    return this.effectiveGroups.get(key);
  }

  public getAllEffectiveGroups(): readonly EffectiveItemGroup[] {
    this.ensureResolved();
    return Array.from(this.effectiveGroups.values());
  }

  public findGroupsContainingItem(itemIdentifier: string | number): readonly EffectiveItemGroup[] {
    this.ensureResolved();
    const query = String(itemIdentifier).trim().toLowerCase();
    const keys = this.itemToGroupKeys.get(query);
    if (!keys || keys.size === 0) {
      return [];
    }
    return Array.from(keys)
      .map((k) => this.effectiveGroups.get(k))
      .filter((g): g is EffectiveItemGroup => g !== undefined);
  }

  public findSourceGroups(key: string): readonly SourceItemGroup[] {
    const results: SourceItemGroup[] = [];
    for (const layerData of this.getAllLayers()) {
      const found = layerData.file.groups.find((group) => group.key === key);
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

    this.effectiveGroups.clear();
    this.itemToGroupKeys.clear();

    const sortedLayers = this.getAllLayers();

    interface GroupBuildState {
      key: string;
      group: string;
      subGroup?: number;
      fields: ItemGroupRawFields;
      fieldOrigins: Record<string, FieldOrigin>;
      layerProvenance: string[];
    }

    const stateMap = new Map<string, GroupBuildState>();

    for (const layerData of sortedLayers) {
      if (layerData.file.header.clear) {
        stateMap.clear();
        this.itemToGroupKeys.clear();
      }

      for (const srcGroup of layerData.file.groups) {
        const groupName = srcGroup.group || srcGroup.fields.Group || '';
        const subGroup = srcGroup.subGroup ?? srcGroup.fields.SubGroup;
        const key = srcGroup.key || normalizeItemGroupKey(groupName, subGroup);
        if (!key) continue;

        let state = stateMap.get(key);
        if (!state) {
          state = {
            key,
            group: groupName,
            subGroup,
            fields: { Group: groupName, SubGroup: subGroup, List: [] },
            fieldOrigins: {},
            layerProvenance: [layerData.layer.id],
          };
          stateMap.set(key, state);
        } else {
          if (!state.layerProvenance.includes(layerData.layer.id)) {
            state.layerProvenance.push(layerData.layer.id);
          }
        }

        for (const fieldKey of srcGroup.presentKeys) {
          const val = srcGroup.fields[fieldKey];
          (state.fields as unknown as Record<string, unknown>)[fieldKey] = val;

          state.fieldOrigins[fieldKey] = {
            layerId: layerData.layer.id,
            filePath: layerData.layer.relativePath,
            layerVariant: layerData.layer.variant,
            value: val,
            range: srcGroup.fieldRanges[fieldKey],
          };
        }
      }
    }

    for (const [key, state] of stateMap.entries()) {
      if (!state.fields.List && state.fields.SubGroups) {
        state.fields.List = getItemGroupAllEntries(state.fields);
      }

      const effective = createEffectiveItemGroup({
        key,
        group: state.group,
        subGroup: state.subGroup,
        databaseVariant: this.variant,
        fields: state.fields,
        fieldOrigins: state.fieldOrigins,
        layerProvenance: state.layerProvenance,
      });

      this.effectiveGroups.set(key, effective);

      const allEntries = getItemGroupAllEntries(effective.fields);
      for (const entry of allEntries) {
        if (entry.Item) {
          const itemKey = String(entry.Item).trim().toLowerCase();
          if (!this.itemToGroupKeys.has(itemKey)) {
            this.itemToGroupKeys.set(itemKey, new Set());
          }
          this.itemToGroupKeys.get(itemKey)!.add(key);
        }
      }
    }

    this.isDirty = false;
  }
}
