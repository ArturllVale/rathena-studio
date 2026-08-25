import { DatabaseVariant } from '../common/databaseVariant';
import { ItemRawFields } from './itemTypes';

export interface SourceItemRange {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface SourceItem {
  readonly id: number;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<ItemRawFields>>;
  readonly presentKeys: ReadonlySet<keyof ItemRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceItemRange;
  readonly fieldRanges: Readonly<Record<string, SourceItemRange>>;
}

export function createSourceItem(params: {
  id: number;
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<ItemRawFields>;
  presentKeys: Set<keyof ItemRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceItemRange;
  fieldRanges?: Record<string, SourceItemRange>;
}): SourceItem {
  return {
    id: params.id,
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
