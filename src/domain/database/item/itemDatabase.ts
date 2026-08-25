import { DatabaseLayer } from '../common/databaseLayer';
import { SourceItem } from './sourceItem';

export interface ItemDatabaseHeader {
  readonly type: string;
  readonly version: number;
  readonly clear?: boolean;
}

export interface ItemDatabaseFooterImport {
  readonly path: string;
  readonly mode?: 'Renewal' | 'Prerenewal';
  readonly generator?: boolean;
}

export interface ItemDatabaseFile {
  readonly layer: DatabaseLayer;
  readonly header: ItemDatabaseHeader;
  readonly imports: readonly ItemDatabaseFooterImport[];
  readonly items: readonly SourceItem[];
  readonly rawText: string;
}
