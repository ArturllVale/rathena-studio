import { DatabaseLayer } from '../common/databaseLayer';
import { SourceItemGroup } from './sourceItemGroup';
import { ItemDatabaseFooterImport } from '../item/itemDatabase';

export interface ItemGroupDatabaseHeader {
  readonly type: string;
  readonly version: number;
  readonly clear?: boolean;
}

export interface ItemGroupDatabaseFile {
  readonly layer: DatabaseLayer;
  readonly header: ItemGroupDatabaseHeader;
  readonly imports: readonly ItemDatabaseFooterImport[];
  readonly groups: readonly SourceItemGroup[];
  readonly rawText: string;
}
