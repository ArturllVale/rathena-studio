import { DatabaseVariant } from '../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../domain/database/common/databaseLayer';
import { createEffectiveItem, EffectiveItem, FieldOrigin } from '../../domain/database/item/effectiveItem';
import { ItemDatabaseFile } from '../../domain/database/item/itemDatabase';
import { ItemRawFields, MAX_ZENY } from '../../domain/database/item/itemTypes';
import { SourceItem } from '../../domain/database/item/sourceItem';
import { YamlDocumentAdapter } from './yamlDocumentAdapter';

export interface RegisteredLayerData {
  readonly layer: DatabaseLayer;
  readonly file: ItemDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredItemRepository {
  private readonly variant: DatabaseVariant;
  private readonly layers: Map<string, RegisteredLayerData> = new Map();
  private effectiveItems: Map<number, EffectiveItem> = new Map();
  private aegisNameToId: Map<string, number> = new Map();
  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addLayer(layerData: RegisteredLayerData): void {
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

  public getLayer(layerId: string): RegisteredLayerData | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): readonly RegisteredLayerData[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findById(id: number): EffectiveItem | undefined {
    this.ensureResolved();
    return this.effectiveItems.get(id);
  }

  public findByAegisName(aegisName: string): EffectiveItem | undefined {
    this.ensureResolved();
    const id = this.aegisNameToId.get(aegisName.trim().toLowerCase());
    return id !== undefined ? this.effectiveItems.get(id) : undefined;
  }

  public getAllEffectiveItems(): readonly EffectiveItem[] {
    this.ensureResolved();
    return Array.from(this.effectiveItems.values());
  }

  public findSourceItems(id: number): readonly SourceItem[] {
    const results: SourceItem[] = [];
    for (const layerData of this.getAllLayers()) {
      const found = layerData.file.items.find((item) => item.id === id);
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

    this.effectiveItems.clear();
    this.aegisNameToId.clear();

    const sortedLayers = this.getAllLayers();

    // Intermediate state per item during layering
    interface ItemBuildState {
      fields: ItemRawFields;
      fieldOrigins: Record<string, FieldOrigin>;
      layerProvenance: string[];
      hasBuyPriceExplicit: boolean;
      hasSellPriceExplicit: boolean;
    }

    const stateMap = new Map<number, ItemBuildState>();

    for (const layerData of sortedLayers) {
      if (layerData.file.header.clear) {
        stateMap.clear();
        this.aegisNameToId.clear();
      }

      for (const srcItem of layerData.file.items) {
        const id = srcItem.id;
        let state = stateMap.get(id);

        if (!state) {
          state = {
            fields: {},
            fieldOrigins: {},
            layerProvenance: [layerData.layer.id],
            hasBuyPriceExplicit: false,
            hasSellPriceExplicit: false,
          };
          stateMap.set(id, state);
        } else {
          if (!state.layerProvenance.includes(layerData.layer.id)) {
            state.layerProvenance.push(layerData.layer.id);
          }
        }

        // Merge only explicitly present fields
        for (const key of srcItem.presentKeys) {
          const val = srcItem.fields[key];
          (state.fields as Record<string, unknown>)[key] = val;

          state.fieldOrigins[key] = {
            layerId: layerData.layer.id,
            filePath: layerData.layer.relativePath,
            layerVariant: layerData.layer.variant,
            value: val,
            range: srcItem.fieldRanges[key],
          };

          if (key === 'Buy') {
            state.hasBuyPriceExplicit = true;
          }
          if (key === 'Sell') {
            state.hasSellPriceExplicit = true;
          }
        }
      }
    }

    // Post-resolution (rAthena loadingFinished emulation)
    for (const [id, state] of stateMap.entries()) {
      const fields = { ...state.fields };

      // Price reciprocal calculation
      if (!state.hasBuyPriceExplicit && state.hasSellPriceExplicit && fields.Sell !== undefined) {
        fields.Buy = Math.min(fields.Sell * 2, MAX_ZENY);
      } else if (state.hasBuyPriceExplicit && !state.hasSellPriceExplicit && fields.Buy !== undefined) {
        fields.Sell = Math.floor(fields.Buy / 2);
      }

      // Default type if missing
      if (!fields.Type) {
        fields.Type = 'Etc';
      }

      // Default weapon level
      if (fields.Type === 'Weapon') {
        if (!fields.WeaponLevel || fields.WeaponLevel === 0) {
          fields.WeaponLevel = 1;
        }
        fields.ArmorLevel = 0;
      } else if (fields.Type === 'Armor') {
        if (!fields.ArmorLevel || fields.ArmorLevel === 0) {
          fields.ArmorLevel = 1;
        }
        fields.WeaponLevel = 0;
      } else {
        fields.WeaponLevel = 0;
        fields.ArmorLevel = 0;
      }

      const effective = createEffectiveItem({
        id,
        databaseVariant: this.variant,
        fields,
        fieldOrigins: state.fieldOrigins,
        layerProvenance: state.layerProvenance,
        hasBuyPriceExplicit: state.hasBuyPriceExplicit,
        hasSellPriceExplicit: state.hasSellPriceExplicit,
      });

      this.effectiveItems.set(id, effective);

      if (effective.fields.AegisName) {
        this.aegisNameToId.set(effective.fields.AegisName.trim().toLowerCase(), id);
      }
    }

    this.isDirty = false;
  }
}
