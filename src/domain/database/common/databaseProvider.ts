import { DatabaseContext } from './databaseContext';
import { DatabaseMetadata } from './databaseState';

export interface DatabaseProvider<TRepository = unknown> {
  readonly id: string;
  readonly name: string;
  getMetadata(): DatabaseMetadata;
  load(context: DatabaseContext): Promise<TRepository>;
  getRepository(): TRepository | null;
  unload(): void;
}
