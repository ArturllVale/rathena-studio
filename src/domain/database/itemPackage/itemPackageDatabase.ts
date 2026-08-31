import { DatabaseLayer } from '../common/databaseLayer';
import { SourceItemPackage } from './sourceItemPackage';
import { ItemDatabaseFooterImport } from '../item/itemDatabase';

export interface ItemPackageDatabaseHeader {
  readonly type: string;
  readonly version: number;
  readonly clear?: boolean;
}

export interface ItemPackageDatabaseFile {
  readonly layer: DatabaseLayer;
  readonly header: ItemPackageDatabaseHeader;
  readonly imports: readonly ItemDatabaseFooterImport[];
  readonly packages: readonly SourceItemPackage[];
  readonly rawText: string;
}
