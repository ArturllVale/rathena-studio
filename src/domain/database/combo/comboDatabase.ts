import { DatabaseLayer } from '../common/databaseLayer';
import { SourceItemCombo } from './sourceCombo';
import { ItemDatabaseFooterImport } from '../item/itemDatabase';

export interface ItemComboDatabaseHeader {
  readonly type: string;
  readonly version: number;
  readonly clear?: boolean;
}

export interface ItemComboDatabaseFile {
  readonly layer: DatabaseLayer;
  readonly header: ItemComboDatabaseHeader;
  readonly imports: readonly ItemDatabaseFooterImport[];
  readonly combos: readonly SourceItemCombo[];
  readonly rawText: string;
}
