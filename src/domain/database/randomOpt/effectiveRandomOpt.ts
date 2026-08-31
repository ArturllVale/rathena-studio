import { DatabaseVariant } from '../common/databaseVariant';
import { RandomOptionRawFields, RandomOptionGroupRawFields } from './randomOptTypes';
import { FieldOrigin } from '../item/effectiveItem';

export interface EffectiveRandomOption {
  readonly id: number;
  readonly option: string;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<RandomOptionRawFields>;
  readonly fieldOrigins: Readonly<Record<string, FieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveRandomOption(params: {
  id: number;
  option: string;
  databaseVariant: DatabaseVariant;
  fields: RandomOptionRawFields;
  fieldOrigins: Record<string, FieldOrigin>;
  layerProvenance: string[];
}): EffectiveRandomOption {
  return {
    id: params.id,
    option: params.option,
    databaseVariant: params.databaseVariant,
    fields: { ...params.fields },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}

export interface EffectiveRandomOptionGroup {
  readonly id: number;
  readonly group: string;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<RandomOptionGroupRawFields>;
  readonly fieldOrigins: Readonly<Record<string, FieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveRandomOptionGroup(params: {
  id: number;
  group: string;
  databaseVariant: DatabaseVariant;
  fields: RandomOptionGroupRawFields;
  fieldOrigins: Record<string, FieldOrigin>;
  layerProvenance: string[];
}): EffectiveRandomOptionGroup {
  return {
    id: params.id,
    group: params.group,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      Slots: params.fields.Slots
        ? params.fields.Slots.map((s) => ({
            Slot: s.Slot,
            Options: s.Options ? s.Options.map((o) => ({ ...o })) : [],
          }))
        : [],
    },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}
