import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { MobRawFields } from '../../../domain/database/mob/mobTypes';
import { RegisteredMobLayerData } from './layeredMobRepository';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class MobDatabaseSerializer {
  public findMobNodeIndex(layerData: RegisteredMobLayerData, mobId: number): number {
    const sourceMob = layerData.file.mobs.get(mobId);
    return sourceMob ? sourceMob.nodeIndex : -1;
  }

  public updateFieldById(
    layerData: RegisteredMobLayerData,
    mobId: number,
    field: keyof MobRawFields | string,
    value: unknown
  ): boolean {
    const nodeIndex = this.findMobNodeIndex(layerData, mobId);
    if (nodeIndex === -1) {
      return false;
    }
    this.updateMobField(layerData.adapter, nodeIndex, field, value);
    return true;
  }

  public removeFieldById(
    layerData: RegisteredMobLayerData,
    mobId: number,
    field: keyof MobRawFields | string
  ): boolean {
    const nodeIndex = this.findMobNodeIndex(layerData, mobId);
    if (nodeIndex === -1) {
      return false;
    }
    return this.removeMobField(layerData.adapter, nodeIndex, field);
  }

  public updateMobField(
    adapter: YamlDocumentAdapter,
    mobIndex: number,
    field: keyof MobRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', mobIndex, field], value);
  }

  public removeMobField(
    adapter: YamlDocumentAdapter,
    mobIndex: number,
    field: keyof MobRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', mobIndex, field]);
  }

  public addMob(adapter: YamlDocumentAdapter, mob: Partial<MobRawFields>): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'MOB_DB', Version: 3 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(mob));
    return index;
  }

  public removeMob(adapter: YamlDocumentAdapter, mobIndex: number): boolean {
    return adapter.deleteIn(['Body', mobIndex]);
  }

  public serialize(layerData: RegisteredMobLayerData, targetVariant: DatabaseVariant): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize monster layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
