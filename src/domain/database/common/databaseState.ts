import { DatabaseVariant } from './databaseVariant';

export type DatabaseStatus = 'unloaded' | 'loading' | 'loaded' | 'error';

export interface DatabaseMetadata {
  readonly id: string;
  readonly name: string;
  readonly variant: DatabaseVariant;
  readonly entityCount: number;
  readonly files: readonly string[];
  readonly lastLoadedAt?: Date | null;
  readonly status: DatabaseStatus;
  readonly error?: string | null;
  readonly isDirty: boolean;
}
