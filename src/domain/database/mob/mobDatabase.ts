import { SourceMob } from './sourceMob';

export interface MobDatabaseHeader {
  readonly type: 'MOB_DB';
  readonly version: number;
}

export interface MobDatabaseFooterImport {
  readonly path: string;
  readonly mode?: string;
}

export interface MobDatabaseFooter {
  readonly imports: readonly MobDatabaseFooterImport[];
}

export interface MobDatabaseFile {
  readonly header: MobDatabaseHeader;
  readonly mobs: ReadonlyMap<number, SourceMob>;
  readonly footer?: MobDatabaseFooter;
}
