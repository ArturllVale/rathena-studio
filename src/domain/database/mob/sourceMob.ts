import { DatabaseVariant } from '../common/databaseVariant';
import { MobRawFields } from './mobTypes';

export interface SourceMobRange {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface SourceMob {
  readonly id: number;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<MobRawFields>>;
  readonly presentKeys: ReadonlySet<keyof MobRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceMobRange;
  readonly fieldRanges: Readonly<Record<string, SourceMobRange>>;
}

export function createSourceMob(params: {
  id: number;
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<MobRawFields>;
  presentKeys: Set<keyof MobRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceMobRange;
  fieldRanges?: Record<string, SourceMobRange>;
}): SourceMob {
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
