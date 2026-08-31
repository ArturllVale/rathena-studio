import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { ItemPackageRawFields } from '../../../domain/database/itemPackage/itemPackageTypes';
import { RegisteredItemPackageLayerData } from './layeredItemPackageRepository';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class ItemPackageDatabaseSerializer {
  public findPackageNodeIndex(layerData: RegisteredItemPackageLayerData, pkgName: string): number {
    const pkg = layerData.file.packages.find((p) => p.package.toLowerCase() === pkgName.toLowerCase());
    return pkg ? pkg.nodeIndex : -1;
  }

  public updatePackageField(
    adapter: YamlDocumentAdapter,
    pkgIndex: number,
    field: keyof ItemPackageRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', pkgIndex, field], value);
  }

  public removePackageField(
    adapter: YamlDocumentAdapter,
    pkgIndex: number,
    field: keyof ItemPackageRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', pkgIndex, field]);
  }

  public addPackage(adapter: YamlDocumentAdapter, pkg: ItemPackageRawFields): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'ITEM_PACKAGES', Version: 1 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(pkg));
    return index;
  }

  public removePackage(adapter: YamlDocumentAdapter, pkgIndex: number): boolean {
    return adapter.deleteIn(['Body', pkgIndex]);
  }

  public serialize(layerData: RegisteredItemPackageLayerData, targetVariant: DatabaseVariant): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
