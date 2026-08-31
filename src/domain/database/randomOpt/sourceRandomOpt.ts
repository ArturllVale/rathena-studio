import { DatabaseVariant } from '../common/databaseVariant';
import { RandomOptionRawFields, RandomOptionGroupRawFields } from './randomOptTypes';
import { SourceItemRange } from '../item/sourceItem';

export interface SourceRandomOption {
  readonly id: number;
  readonly option: string;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<RandomOptionRawFields>>;
  readonly presentKeys: ReadonlySet<keyof RandomOptionRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceItemRange;
  readonly fieldRanges: Readonly<Record<string, SourceItemRange>>;
}

export function createSourceRandomOption(params: {
  id: number;
  option: string;
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<RandomOptionRawFields>;
  presentKeys: Set<keyof RandomOptionRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceItemRange;
  fieldRanges?: Record<string, SourceItemRange>;
}): SourceRandomOption {
  return {
    id: params.id,
    option: params.option,
    sourceLayerId: params.sourceLayerId,
    sourceFilePath: params.sourceFilePath,
    databaseVariant: params.databaseVariant,
    fields: { ...params.fields },
    presentKeys: new Set(params.presentKeys),
    unknownFields: params.unknownFields ? { ...params.unknownFields } : {},
    nodeIndex: params.nodeIndex,
    entityRange: params.entityRange,
    fieldRanges: params.fieldRanges ? { ...params.fieldRanges } : {},
  };
}

export interface SourceRandomOptionGroup {
  readonly id: number;
  readonly group: string;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<RandomOptionGroupRawFields>>;
  readonly presentKeys: ReadonlySet<keyof RandomOptionGroupRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceItemRange;
  readonly fieldRanges: Readonly<Record<string, SourceItemRange>>;
}

export function createSourceRandomOptionGroup(params: {
  id: number;
  group: string;
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<RandomOptionGroupRawFields>;
  presentKeys: Set<keyof RandomOptionGroupRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceItemRange;
  fieldRanges?: Record<string, SourceItemRange>;
}): SourceRandomOptionGroup {
  return {
    id: params.id,
    group: params.group,
    sourceLayerId: params.sourceLayerId,
    sourceFilePath: params.sourceFilePath,
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
    presentKeys: new Set(params.presentKeys),
    unknownFields: params.unknownFields ? { ...params.unknownFields } : {},
    nodeIndex: params.nodeIndex,
    entityRange: params.entityRange,
    fieldRanges: params.fieldRanges ? { ...params.fieldRanges } : {},
  };
}
