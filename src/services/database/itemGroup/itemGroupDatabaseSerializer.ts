import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { ItemGroupRawFields } from '../../../domain/database/itemGroup/itemGroupTypes';
import { RegisteredItemGroupLayerData } from './layeredItemGroupRepository';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class ItemGroupDatabaseSerializer {
  public findGroupNodeIndex(layerData: RegisteredItemGroupLayerData, groupKey: string): number {
    const group = layerData.file.groups.find((g) => g.key === groupKey);
    return group ? group.nodeIndex : -1;
  }

  public updateGroupField(
    adapter: YamlDocumentAdapter,
    groupIndex: number,
    field: keyof ItemGroupRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', groupIndex, field], value);
    if (field === 'SubGroups' && Array.isArray(value) && value.length > 0) {
      adapter.deleteIn(['Body', groupIndex, 'List']);
    }
  }

  public removeGroupField(
    adapter: YamlDocumentAdapter,
    groupIndex: number,
    field: keyof ItemGroupRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', groupIndex, field]);
  }

  public addGroup(adapter: YamlDocumentAdapter, group: ItemGroupRawFields): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'ITEM_GROUP_DB', Version: 1 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const payload: Partial<ItemGroupRawFields> = { ...group };
    if (payload.SubGroups && payload.SubGroups.length > 0) {
      delete payload.List;
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(payload));
    return index;
  }

  public removeGroup(adapter: YamlDocumentAdapter, groupIndex: number): boolean {
    return adapter.deleteIn(['Body', groupIndex]);
  }

  public serialize(layerData: RegisteredItemGroupLayerData, targetVariant: DatabaseVariant): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
