import { DatabaseVariant } from '../common/databaseVariant';
import { ItemComboRawFields } from './comboTypes';
import { FieldOrigin } from '../item/effectiveItem';

export interface EffectiveItemCombo {
  readonly key: string;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<ItemComboRawFields>;
  readonly fieldOrigins: Readonly<Record<string, FieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveItemCombo(params: {
  key: string;
  databaseVariant: DatabaseVariant;
  fields: ItemComboRawFields;
  fieldOrigins: Record<string, FieldOrigin>;
  layerProvenance: string[];
}): EffectiveItemCombo {
  return {
    key: params.key,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      Combo: [...(params.fields.Combo || [])],
    },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}
