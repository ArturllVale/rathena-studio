import { DatabaseProvider, DatabaseProviderId } from '../provider/databaseProvider';

export class DatabaseRegistry {
  private providers = new Map<DatabaseProviderId, DatabaseProvider<unknown>>();

  public register(provider: DatabaseProvider<unknown>): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider<T = unknown>(id: DatabaseProviderId): DatabaseProvider<T> | undefined {
    return this.providers.get(id) as unknown as DatabaseProvider<T> | undefined;
  }

  public getAllProviders(): readonly DatabaseProvider<unknown>[] {
    return Array.from(this.providers.values());
  }
}
