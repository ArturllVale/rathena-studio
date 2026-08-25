import { DatabaseVariant } from './databaseVariant';
import { DatabaseLayer } from './databaseLayer';

export interface DatabaseContext {
  readonly variant: DatabaseVariant;
  readonly layers: readonly DatabaseLayer[];
  readonly workspacePath?: string;
  readonly loadedAt: Date;
}

export function createEmptyDatabaseContext(variant: DatabaseVariant, workspacePath?: string): DatabaseContext {
  return {
    variant,
    layers: [],
    workspacePath,
    loadedAt: new Date(),
  };
}
