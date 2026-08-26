import { DatabaseProvider, DatabaseProviderId } from '../provider/databaseProvider';

export class DatabaseRegistry {
  private providers = new Map<DatabaseProviderId, DatabaseProvider<any>>();

  public register(provider: DatabaseProvider<any>): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider<T = unknown>(id: DatabaseProviderId): DatabaseProvider<T> | undefined {
    return this.providers.get(id) as DatabaseProvider<T> | undefined;
  }

  public getAllProviders(): readonly DatabaseProvider<any>[] {
    return Array.from(this.providers.values());
  }
}
