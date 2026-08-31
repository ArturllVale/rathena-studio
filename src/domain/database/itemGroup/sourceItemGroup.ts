import { DatabaseVariant } from '../common/databaseVariant';
import { ItemGroupRawFields, normalizeItemGroupKey } from './itemGroupTypes';
import { SourceItemRange } from '../item/sourceItem';

export interface SourceItemGroup {
  readonly key: string;
  readonly group: string;
  readonly subGroup?: number;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<ItemGroupRawFields>>;
  readonly presentKeys: ReadonlySet<keyof ItemGroupRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceItemRange;
  readonly fieldRanges: Readonly<Record<string, SourceItemRange>>;
}

export function createSourceItemGroup(params: {
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<ItemGroupRawFields>;
  presentKeys: Set<keyof ItemGroupRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceItemRange;
  fieldRanges?: Record<string, SourceItemRange>;
}): SourceItemGroup {
  const group = params.fields.Group || '';
  const subGroup = params.fields.SubGroup;
  const key = normalizeItemGroupKey(group, subGroup);

  return {
    key,
    group,
    subGroup,
    sourceLayerId: params.sourceLayerId,
    sourceFilePath: params.sourceFilePath,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      List: params.fields.List ? params.fields.List.map((entry) => ({ ...entry })) : [],
    },
    presentKeys: new Set(params.presentKeys),
    unknownFields: params.unknownFields ? { ...params.unknownFields } : {},
    nodeIndex: params.nodeIndex,
    entityRange: params.entityRange,
    fieldRanges: params.fieldRanges ? { ...params.fieldRanges } : {},
  };
}
