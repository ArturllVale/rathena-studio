import { DatabaseVariant } from '../common/databaseVariant';
import { SkillRawFields } from './skillTypes';

export interface SourceSkillRange {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface SourceSkill {
  readonly id: number;
  readonly name: string;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<SkillRawFields>>;
  readonly presentKeys: ReadonlySet<keyof SkillRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceSkillRange;
  readonly fieldRanges: Readonly<Record<string, SourceSkillRange>>;
}

export function createSourceSkill(params: {
  id: number;
  name: string;
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<SkillRawFields>;
  presentKeys: Set<keyof SkillRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceSkillRange;
  fieldRanges?: Record<string, SourceSkillRange>;
}): SourceSkill {
  return {
    id: params.id,
    name: params.name,
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
