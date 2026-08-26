import { DatabaseContext } from '../common/databaseContext';

export type DatabaseProviderId = 'item' | 'mob' | 'skill' | 'quest' | 'instance';

export interface DatabaseMetadata {
  readonly id: DatabaseProviderId;
  readonly name: string;
  readonly entityCount: number;
  readonly loadedFiles: string[];
  readonly lastLoaded?: Date;
  readonly state: 'not_loaded' | 'loading' | 'loaded' | 'error';
  readonly error?: Error;
}

export interface DatabaseProvider<TRepository = unknown> {
  readonly id: DatabaseProviderId;
  readonly name: string;
  getMetadata(): DatabaseMetadata;
  load(context: DatabaseContext): Promise<void>;
  getRepository(): TRepository | undefined;
}
