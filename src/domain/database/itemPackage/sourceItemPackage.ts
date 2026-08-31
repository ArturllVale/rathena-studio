import { DatabaseVariant } from '../common/databaseVariant';
import { ItemPackageRawFields } from './itemPackageTypes';
import { SourceItemRange } from '../item/sourceItem';

export interface SourceItemPackage {
  readonly key: string;
  readonly package: string;
  readonly sourceLayerId: string;
  readonly sourceFilePath: string;
  readonly databaseVariant: DatabaseVariant | 'UNIVERSAL';
  readonly fields: Readonly<Partial<ItemPackageRawFields>>;
  readonly presentKeys: ReadonlySet<keyof ItemPackageRawFields>;
  readonly unknownFields: Readonly<Record<string, unknown>>;
  readonly nodeIndex: number;
  readonly entityRange?: SourceItemRange;
  readonly fieldRanges: Readonly<Record<string, SourceItemRange>>;
}

export function createSourceItemPackage(params: {
  sourceLayerId: string;
  sourceFilePath: string;
  databaseVariant: DatabaseVariant | 'UNIVERSAL';
  fields: Partial<ItemPackageRawFields>;
  presentKeys: Set<keyof ItemPackageRawFields>;
  unknownFields?: Record<string, unknown>;
  nodeIndex: number;
  entityRange?: SourceItemRange;
  fieldRanges?: Record<string, SourceItemRange>;
}): SourceItemPackage {
  const pkg = params.fields.Package || '';

  return {
    key: pkg,
    package: pkg,
    sourceLayerId: params.sourceLayerId,
    sourceFilePath: params.sourceFilePath,
    databaseVariant: params.databaseVariant,
    fields: {
      ...params.fields,
      RandomOptions: params.fields.RandomOptions
        ? {
            Count: params.fields.RandomOptions.Count,
            List: params.fields.RandomOptions.List ? params.fields.RandomOptions.List.map((e) => ({ ...e })) : [],
          }
        : undefined,
      Groups: params.fields.Groups
        ? params.fields.Groups.map((g) => ({
            ...g,
            List: g.List ? g.List.map((e) => ({ ...e })) : [],
          }))
        : undefined,
    },
    presentKeys: new Set(params.presentKeys),
    unknownFields: params.unknownFields ? { ...params.unknownFields } : {},
    nodeIndex: params.nodeIndex,
    entityRange: params.entityRange,
    fieldRanges: params.fieldRanges ? { ...params.fieldRanges } : {},
  };
}
