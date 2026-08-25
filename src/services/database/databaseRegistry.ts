import { DatabaseProvider } from '../../domain/database/common/databaseProvider';

export class DatabaseRegistry {
  private readonly providers = new Map<string, DatabaseProvider>();

  public registerProvider(provider: DatabaseProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider<T = unknown>(id: string): DatabaseProvider<T> | undefined {
    return this.providers.get(id) as DatabaseProvider<T> | undefined;
  }

  public getAllProviders(): readonly DatabaseProvider[] {
    return Array.from(this.providers.values());
  }

  public hasProvider(id: string): boolean {
    return this.providers.has(id);
  }

  public unregisterProvider(id: string): boolean {
    const provider = this.providers.get(id);
    if (provider) {
      provider.unload();
      return this.providers.delete(id);
    }
    return false;
  }

  public clear(): void {
    for (const provider of this.providers.values()) {
      provider.unload();
    }
    this.providers.clear();
  }
}
