import { DatabaseVariant } from '../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../domain/database/common/databaseLayer';
import { ItemRawFields } from '../../domain/database/item/itemTypes';
import { RegisteredLayerData } from './layeredItemRepository';
import { YamlDocumentAdapter } from './yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class ItemDatabaseSerializer {
  public findItemNodeIndex(layerData: RegisteredLayerData, itemId: number): number {
    const item = layerData.file.items.find((i) => i.id === itemId);
    return item ? item.nodeIndex : -1;
  }

  public updateFieldById(
    layerData: RegisteredLayerData,
    itemId: number,
    field: keyof ItemRawFields | string,
    value: unknown
  ): boolean {
    const nodeIndex = this.findItemNodeIndex(layerData, itemId);
    if (nodeIndex === -1) {
      return false;
    }
    this.updateItemField(layerData.adapter, nodeIndex, field, value);
    return true;
  }

  public removeFieldById(
    layerData: RegisteredLayerData,
    itemId: number,
    field: keyof ItemRawFields | string
  ): boolean {
    const nodeIndex = this.findItemNodeIndex(layerData, itemId);
    if (nodeIndex === -1) {
      return false;
    }
    return this.removeItemField(layerData.adapter, nodeIndex, field);
  }

  public removeItemById(layerData: RegisteredLayerData, itemId: number): boolean {
    const nodeIndex = this.findItemNodeIndex(layerData, itemId);
    if (nodeIndex === -1) {
      return false;
    }
    return this.removeItem(layerData.adapter, nodeIndex);
  }

  public updateItemField(
    adapter: YamlDocumentAdapter,
    itemIndex: number,
    field: keyof ItemRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', itemIndex, field], value);
  }

  public removeItemField(
    adapter: YamlDocumentAdapter,
    itemIndex: number,
    field: keyof ItemRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', itemIndex, field]);
  }

  public addItem(adapter: YamlDocumentAdapter, item: ItemRawFields): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      // We must preserve Header/Body structure. If it was missing entirely, we set it.
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
            rawDoc.set('Header', rawDoc.createNode({ Type: 'ITEM_DB', Version: 1 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(item));
    return index;
  }

  public removeItem(adapter: YamlDocumentAdapter, itemIndex: number): boolean {
    return adapter.deleteIn(['Body', itemIndex]);
  }

  public serialize(layerData: RegisteredLayerData, targetVariant: DatabaseVariant): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
