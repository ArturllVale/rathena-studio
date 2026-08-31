import { DatabaseVariant } from '../common/databaseVariant';
import { ItemComboRawFields, normalizeComboKey } from './comboTypes';
import { SourceItemRange } from '../item/sourceItem';

export interface SourceItemCombo {
  readonly key: string;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<ItemComboRawFields>>;
  readonly presentKeys: ReadonlySet<keyof ItemComboRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceItemRange;
  readonly fieldRanges: Readonly<Record<string, SourceItemRange>>;
}

export function createSourceItemCombo(params: {
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<ItemComboRawFields>;
  presentKeys: Set<keyof ItemComboRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceItemRange;
  fieldRanges?: Record<string, SourceItemRange>;
}): SourceItemCombo {
  const key = normalizeComboKey(params.fields.Combo || []);
  return {
    key,
    sourceLayerId: params.sourceLayerId,
    sourceFilePath: params.sourceFilePath,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      Combo: params.fields.Combo ? [...params.fields.Combo] : [],
    },
    presentKeys: new Set(params.presentKeys),
    unknownFields: params.unknownFields ? { ...params.unknownFields } : {},
    nodeIndex: params.nodeIndex,
    entityRange: params.entityRange,
    fieldRanges: params.fieldRanges ? { ...params.fieldRanges } : {},
  };
}
