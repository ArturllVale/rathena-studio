import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { RandomOptionRawFields, RandomOptionGroupRawFields } from '../../../domain/database/randomOpt/randomOptTypes';
import { RegisteredRandomOptLayerData, RegisteredRandomOptGroupLayerData } from './layeredRandomOptRepository';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class RandomOptDatabaseSerializer {
  public findOptionNodeIndex(layerData: RegisteredRandomOptLayerData, optionId: number): number {
    const opt = layerData.file.options.find((o) => o.id === optionId);
    return opt ? opt.nodeIndex : -1;
  }

  public findGroupNodeIndex(layerData: RegisteredRandomOptGroupLayerData, groupId: number): number {
    const grp = layerData.file.groups.find((g) => g.id === groupId);
    return grp ? grp.nodeIndex : -1;
  }

  public updateOptionField(
    adapter: YamlDocumentAdapter,
    optIndex: number,
    field: keyof RandomOptionRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', optIndex, field], value);
  }

  public removeOptionField(
    adapter: YamlDocumentAdapter,
    optIndex: number,
    field: keyof RandomOptionRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', optIndex, field]);
  }

  public updateGroupField(
    adapter: YamlDocumentAdapter,
    grpIndex: number,
    field: keyof RandomOptionGroupRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', grpIndex, field], value);
  }

  public removeGroupField(
    adapter: YamlDocumentAdapter,
    grpIndex: number,
    field: keyof RandomOptionGroupRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', grpIndex, field]);
  }

  public addOption(adapter: YamlDocumentAdapter, opt: RandomOptionRawFields): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'RANDOM_OPTION_DB', Version: 1 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(opt));
    return index;
  }

  public addGroup(adapter: YamlDocumentAdapter, grp: RandomOptionGroupRawFields): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'RANDOM_OPTION_GROUP', Version: 1 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(grp));
    return index;
  }

  public serialize(
    layerData: RegisteredRandomOptLayerData | RegisteredRandomOptGroupLayerData,
    targetVariant: DatabaseVariant
  ): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
