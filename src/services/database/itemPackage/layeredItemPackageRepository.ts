import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { DatabaseLayer, isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { createEffectiveItemPackage, EffectiveItemPackage } from '../../../domain/database/itemPackage/effectiveItemPackage';
import { ItemPackageDatabaseFile } from '../../../domain/database/itemPackage/itemPackageDatabase';
import { ItemPackageRawFields } from '../../../domain/database/itemPackage/itemPackageTypes';
import { SourceItemPackage } from '../../../domain/database/itemPackage/sourceItemPackage';
import { FieldOrigin } from '../../../domain/database/item/effectiveItem';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';

export interface RegisteredItemPackageLayerData {
  readonly layer: DatabaseLayer;
  readonly file: ItemPackageDatabaseFile;
  readonly adapter: YamlDocumentAdapter;
}

export class LayeredItemPackageRepository {
  private readonly variant: DatabaseVariant;
  private readonly layers: Map<string, RegisteredItemPackageLayerData> = new Map();
  private effectivePackages: Map<string, EffectiveItemPackage> = new Map();
  private itemToPackageKeys: Map<string, Set<string>> = new Map();
  private isDirty = true;

  public constructor(variant: DatabaseVariant) {
    this.variant = variant;
  }

  public getVariant(): DatabaseVariant {
    return this.variant;
  }

  public addLayer(layerData: RegisteredItemPackageLayerData): void {
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

  public getLayer(layerId: string): RegisteredItemPackageLayerData | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): readonly RegisteredItemPackageLayerData[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layer.priority - b.layer.priority);
  }

  public findByPackage(packageName: string): EffectiveItemPackage | undefined {
    this.ensureResolved();
    return this.effectivePackages.get(packageName.trim().toLowerCase());
  }

  public getAllEffectivePackages(): readonly EffectiveItemPackage[] {
    this.ensureResolved();
    return Array.from(this.effectivePackages.values());
  }

  public findPackagesContainingItem(itemIdentifier: string | number): readonly EffectiveItemPackage[] {
    this.ensureResolved();
    const query = String(itemIdentifier).trim().toLowerCase();
    const keys = this.itemToPackageKeys.get(query);
    if (!keys || keys.size === 0) {
      return [];
    }
    return Array.from(keys)
      .map((k) => this.effectivePackages.get(k))
      .filter((p): p is EffectiveItemPackage => p !== undefined);
  }

  public findSourcePackages(packageName: string): readonly SourceItemPackage[] {
    const results: SourceItemPackage[] = [];
    const query = packageName.trim().toLowerCase();
    for (const layerData of this.getAllLayers()) {
      const found = layerData.file.packages.find((p) => p.package.toLowerCase() === query);
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

    this.effectivePackages.clear();
    this.itemToPackageKeys.clear();

    const sortedLayers = this.getAllLayers();

    interface PackageBuildState {
      pkgName: string;
      fields: ItemPackageRawFields;
      fieldOrigins: Record<string, FieldOrigin>;
      layerProvenance: string[];
    }

    const stateMap = new Map<string, PackageBuildState>();

    for (const layerData of sortedLayers) {
      if (layerData.file.header.clear) {
        stateMap.clear();
        this.itemToPackageKeys.clear();
      }

      for (const srcPkg of layerData.file.packages) {
        const pkgName = srcPkg.package || srcPkg.fields.Package || '';
        if (!pkgName) continue;
        const normalizedKey = pkgName.trim().toLowerCase();

        let state = stateMap.get(normalizedKey);
        if (!state) {
          state = {
            pkgName,
            fields: { Package: pkgName },
            fieldOrigins: {},
            layerProvenance: [layerData.layer.id],
          };
          stateMap.set(normalizedKey, state);
        } else {
          if (!state.layerProvenance.includes(layerData.layer.id)) {
            state.layerProvenance.push(layerData.layer.id);
          }
        }

        for (const fieldKey of srcPkg.presentKeys) {
          const val = srcPkg.fields[fieldKey];
          (state.fields as unknown as Record<string, unknown>)[fieldKey] = val;

          state.fieldOrigins[fieldKey] = {
            layerId: layerData.layer.id,
            filePath: layerData.layer.relativePath,
            layerVariant: layerData.layer.variant,
            value: val,
            range: srcPkg.fieldRanges[fieldKey],
          };
        }
      }
    }

    for (const [key, state] of stateMap.entries()) {
      const effective = createEffectiveItemPackage({
        key,
        package: state.pkgName,
        databaseVariant: this.variant,
        fields: state.fields,
        fieldOrigins: state.fieldOrigins,
        layerProvenance: state.layerProvenance,
      });

      this.effectivePackages.set(key, effective);

      // Index items inside RandomOptions
      if (effective.fields.RandomOptions?.List) {
        for (const itemEntry of effective.fields.RandomOptions.List) {
          if (itemEntry.Item) {
            const itemKey = String(itemEntry.Item).trim().toLowerCase();
            if (!this.itemToPackageKeys.has(itemKey)) {
              this.itemToPackageKeys.set(itemKey, new Set());
            }
            this.itemToPackageKeys.get(itemKey)!.add(key);
          }
        }
      }

      // Index items inside Groups
      if (effective.fields.Groups) {
        for (const group of effective.fields.Groups) {
          const itemsList = group.Items || group.List || [];
          for (const itemEntry of itemsList) {
            if (itemEntry.Item) {
              const itemKey = String(itemEntry.Item).trim().toLowerCase();
              if (!this.itemToPackageKeys.has(itemKey)) {
                this.itemToPackageKeys.set(itemKey, new Set());
              }
              this.itemToPackageKeys.get(itemKey)!.add(key);
            }
          }
        }
      }
    }

    this.isDirty = false;
  }
}
