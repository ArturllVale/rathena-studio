import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { createEffectiveItemCombo, EffectiveItemCombo } from '../../../domain/database/combo/effectiveCombo';
import { ItemComboDatabaseFile } from '../../../domain/database/combo/comboDatabase';
import { ItemComboRawFields, normalizeComboKey } from '../../../domain/database/combo/comboTypes';
import { SourceItemCombo } from '../../../domain/database/combo/sourceCombo';
import { FieldOrigin } from '../../../domain/database/item/effectiveItem';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RegisteredComboLayerData {
  readonly layer: DatabaseLayer;
  readonly file: ItemComboDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredComboRepository {
  private readonly variant: DatabaseVariant;
  private readonly layers: Map<string, RegisteredComboLayerData> = new Map();
  private effectiveCombos: Map<string, EffectiveItemCombo> = new Map();
  private itemToComboKeys: Map<string, Set<string>> = new Map();
  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addLayer(layerData: RegisteredComboLayerData): void {
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

  public getLayer(layerId: string): RegisteredComboLayerData | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): readonly RegisteredComboLayerData[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findByKey(key: string): EffectiveItemCombo | undefined {
    this.ensureResolved();
    return this.effectiveCombos.get(key);
  }

  public getAllEffectiveCombos(): readonly EffectiveItemCombo[] {
    this.ensureResolved();
    return Array.from(this.effectiveCombos.values());
  }

  public findCombosForItem(itemIdentifier: string | number): readonly EffectiveItemCombo[] {
    this.ensureResolved();
    const query = String(itemIdentifier).trim().toLowerCase();
    const keys = this.itemToComboKeys.get(query);
    if (!keys || keys.size === 0) {
      return [];
    }
    return Array.from(keys)
      .map((k) => this.effectiveCombos.get(k))
      .filter((c): c is EffectiveItemCombo => c !== undefined);
  }

  public findSourceCombos(key: string): readonly SourceItemCombo[] {
    const results: SourceItemCombo[] = [];
    for (const layerData of this.getAllLayers()) {
      const found = layerData.file.combos.find((combo) => combo.key === key);
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

    this.effectiveCombos.clear();
    this.itemToComboKeys.clear();

    const sortedLayers = this.getAllLayers();

    interface ComboBuildState {
      key: string;
      fields: ItemComboRawFields;
      fieldOrigins: Record<string, FieldOrigin>;
      layerProvenance: string[];
    }

    const stateMap = new Map<string, ComboBuildState>();

    for (const layerData of sortedLayers) {
      if (layerData.file.header.clear) {
        stateMap.clear();
        this.itemToComboKeys.clear();
      }

      for (const srcCombo of layerData.file.combos) {
        const key = srcCombo.key || normalizeComboKey(srcCombo.fields.Combo || []);
        if (!key) continue;

        let state = stateMap.get(key);
        if (!state) {
          state = {
            key,
            fields: { Combo: [] },
            fieldOrigins: {},
            layerProvenance: [layerData.layer.id],
          };
          stateMap.set(key, state);
        } else {
          if (!state.layerProvenance.includes(layerData.layer.id)) {
            state.layerProvenance.push(layerData.layer.id);
          }
        }

        for (const fieldKey of srcCombo.presentKeys) {
          const val = srcCombo.fields[fieldKey];
          (state.fields as unknown as Record<string, unknown>)[fieldKey] = val;

          state.fieldOrigins[fieldKey] = {
            layerId: layerData.layer.id,
            filePath: layerData.layer.relativePath,
            layerVariant: layerData.layer.variant,
            value: val,
            range: srcCombo.fieldRanges[fieldKey],
          };
        }
      }
    }

    for (const [key, state] of stateMap.entries()) {
      const effective = createEffectiveItemCombo({
        key,
        databaseVariant: this.variant,
        fields: state.fields,
        fieldOrigins: state.fieldOrigins,
        layerProvenance: state.layerProvenance,
      });

      this.effectiveCombos.set(key, effective);

      if (effective.fields.Combo) {
        for (const item of effective.fields.Combo) {
          const itemKey = String(item).trim().toLowerCase();
          if (!this.itemToComboKeys.has(itemKey)) {
            this.itemToComboKeys.set(itemKey, new Set());
          }
          this.itemToComboKeys.get(itemKey)!.add(key);
        }
      }
    }

    this.isDirty = false;
  }
}
