import { DatabaseVariant } from '../common/databaseVariant';
import { ItemGroupRawFields } from './itemGroupTypes';
import { FieldOrigin } from '../item/effectiveItem';

export interface EffectiveItemGroup {
  readonly key: string;
  readonly group: string;
  readonly subGroup?: number;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<ItemGroupRawFields>;
  readonly fieldOrigins: Readonly<Record<string, FieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveItemGroup(params: {
  key: string;
  group: string;
  subGroup?: number;
  databaseVariant: DatabaseVariant;
  fields: ItemGroupRawFields;
  fieldOrigins: Record<string, FieldOrigin>;
  layerProvenance: string[];
}): EffectiveItemGroup {
  return {
    key: params.key,
    group: params.group,
    subGroup: params.subGroup,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      List: params.fields.List ? params.fields.List.map((entry) => ({ ...entry })) : [],
    },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}
