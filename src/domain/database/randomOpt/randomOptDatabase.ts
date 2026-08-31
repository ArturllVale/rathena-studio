import { DatabaseLayer } from '../common/databaseLayer';
import { SourceRandomOption, SourceRandomOptionGroup } from './sourceRandomOpt';
import { ItemDatabaseFooterImport } from '../item/itemDatabase';

export interface RandomOptionDatabaseHeader {
  readonly type: string;
  readonly version: number;
  readonly clear?: boolean;
}

export interface RandomOptionDatabaseFile {
  readonly layer: DatabaseLayer;
  readonly header: RandomOptionDatabaseHeader;
  readonly imports: readonly ItemDatabaseFooterImport[];
  readonly options: readonly SourceRandomOption[];
  readonly rawText: string;
}

export interface RandomOptionGroupDatabaseFile {
  readonly layer: DatabaseLayer;
  readonly header: RandomOptionDatabaseHeader;
  readonly imports: readonly ItemDatabaseFooterImport[];
  readonly groups: readonly SourceRandomOptionGroup[];
  readonly rawText: string;
}
