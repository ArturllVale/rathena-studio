import { DatabaseVariant } from '../common/databaseVariant';
import { ItemPackageRawFields } from './itemPackageTypes';
import { FieldOrigin } from '../item/effectiveItem';

export interface EffectiveItemPackage {
  readonly key: string;
  readonly package: string;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<ItemPackageRawFields>;
  readonly fieldOrigins: Readonly<Record<string, FieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveItemPackage(params: {
  key: string;
  package: string;
  databaseVariant: DatabaseVariant;
  fields: ItemPackageRawFields;
  fieldOrigins: Record<string, FieldOrigin>;
  layerProvenance: string[];
}): EffectiveItemPackage {
  return {
    key: params.key,
    package: params.package,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      RandomOptions: params.fields.RandomOptions
        ? {
            Count: params.fields.RandomOptions.Count,
            List: params.fields.RandomOptions.List ? params.fields.RandomOptions.List.map((e) => ({ ...e })) : [],
          }
        : undefined,
      Groups: params.fields.Groups
        ? params.fields.Groups.map((g) => ({
            ...g,
            List: g.List ? g.List.map((e) => ({ ...e })) : [],
          }))
        : undefined,
    },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}
