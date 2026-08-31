import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { ItemComboRawFields, normalizeComboKey } from '../../../domain/database/combo/comboTypes';
import { RegisteredComboLayerData } from './layeredComboRepository';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class ComboDatabaseSerializer {
  public findComboNodeIndex(layerData: RegisteredComboLayerData, comboKey: string): number {
    const norm = normalizeComboKey(comboKey.split(' + '));
    const combo = layerData.file.combos.find((c) => c.key === norm || c.key === comboKey);
    return combo ? combo.nodeIndex : -1;
  }

  public updateComboField(
    adapter: YamlDocumentAdapter,
    comboIndex: number,
    field: keyof ItemComboRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', comboIndex, field], value);
  }

  public removeComboField(
    adapter: YamlDocumentAdapter,
    comboIndex: number,
    field: keyof ItemComboRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', comboIndex, field]);
  }

  public addCombo(adapter: YamlDocumentAdapter, combo: ItemComboRawFields): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'ITEM_COMBOS_DB', Version: 1 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(combo));
    return index;
  }

  public removeCombo(adapter: YamlDocumentAdapter, comboIndex: number): boolean {
    return adapter.deleteIn(['Body', comboIndex]);
  }

  public serialize(layerData: RegisteredComboLayerData, targetVariant: DatabaseVariant): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
