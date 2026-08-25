import { DatabaseVariant } from '../common/databaseVariant';
import { ItemRawFields } from './itemTypes';
import { SourceItemRange } from './sourceItem';

export interface FieldOrigin {
  readonly layerId: string;
  readonly filePath: string;
  readonly layerVariant: DatabaseVariant | 'UNIVERSAL';
  readonly value: unknown;
  readonly range?: SourceItemRange;
}

export interface EffectiveItem {
  readonly id: number;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<ItemRawFields>;
  readonly fieldOrigins: Readonly<Record<string, FieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly hasBuyPriceExplicit: boolean;
  readonly hasSellPriceExplicit: boolean;
  readonly isOverridden: boolean;
}

export function createEffectiveItem(params: {
  id: number;
  databaseVariant: DatabaseVariant;
  fields: ItemRawFields;
  fieldOrigins: Record<string, FieldOrigin>;
  layerProvenance: string[];
  hasBuyPriceExplicit: boolean;
  hasSellPriceExplicit: boolean;
}): EffectiveItem {
  return {
    id: params.id,
    databaseVariant: params.databaseVariant,
    fields: { ...params.fields },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    hasBuyPriceExplicit: params.hasBuyPriceExplicit,
    hasSellPriceExplicit: params.hasSellPriceExplicit,
    isOverridden: params.layerProvenance.length > 1,
  };
}
