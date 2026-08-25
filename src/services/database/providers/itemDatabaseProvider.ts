import { DatabaseProvider } from '@/domain/database/common/databaseProvider';
import { DatabaseContext } from '@/domain/database/common/databaseContext';
import { DatabaseMetadata, DatabaseStatus } from '@/domain/database/common/databaseState';
import { DatabaseVariant } from '@/domain/database/common/databaseVariant';
import { LayeredItemRepository } from '../layeredItemRepository';
import { DatabaseContextLoader, LayerFileContentProvider } from '../databaseContextLoader';
import { isTauriEnvironment } from '../../tauriBridge';

export class ItemDatabaseProvider implements DatabaseProvider<LayeredItemRepository> {
  public readonly id = 'items';
  public readonly name = 'Item Database';

  private repository: LayeredItemRepository | null = null;
  private status: DatabaseStatus = 'unloaded';
  private variant: DatabaseVariant = 'RE';
  private lastLoadedAt: Date | null = null;
  private error: string | null = null;
  private loadedFiles: string[] = [];
  private loader: DatabaseContextLoader;

  public constructor(
    loader?: DatabaseContextLoader,
    private readonly customContentProvider?: LayerFileContentProvider
  ) {
    this.loader = loader || new DatabaseContextLoader();
  }

  public getMetadata(): DatabaseMetadata {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      entityCount: this.repository ? this.repository.getAllEffectiveItems().length : 0,
      files: [...this.loadedFiles],
      lastLoadedAt: this.lastLoadedAt,
      status: this.status,
      error: this.error,
      isDirty: false,
    };
  }

  public getRepository(): LayeredItemRepository | null {
    return this.repository;
  }

  public async load(
    context: DatabaseContext,
    overrideContentProvider?: LayerFileContentProvider
  ): Promise<LayeredItemRepository> {
    this.status = 'loading';
    this.error = null;
    this.variant = context.variant;

    const layers = context.layers.length > 0 ? context.layers : this.loader.getStandardLayerPlan(context.variant);
    this.loadedFiles = layers
      .filter((l) => l.variant === 'UNIVERSAL' || l.variant === context.variant)
      .map((l) => l.relativePath);

    const provider = overrideContentProvider || this.customContentProvider || this.createDefaultProvider(context.workspacePath);

    try {
      const { repository } = await this.loader.loadRepositoryFromProvider(context.variant, provider, layers);
      this.repository = repository;
      this.status = 'loaded';
      this.lastLoadedAt = new Date();
      return repository;
    } catch (err) {
      this.status = 'error';
      this.error = (err as Error).message || 'Failed to load Item Database';
      this.repository = null;
      throw err;
    }
  }

  public unload(): void {
    this.repository = null;
    this.status = 'unloaded';
    this.lastLoadedAt = null;
    this.error = null;
    this.loadedFiles = [];
  }

  private createDefaultProvider(workspacePath?: string): LayerFileContentProvider {
    return {
      readFile: async (relativePath: string) => {
        if (isTauriEnvironment()) {
          const { readTextFile } = await import('@tauri-apps/plugin-fs');
          const fullPath = workspacePath ? `${workspacePath}/${relativePath}` : relativePath;
          return await readTextFile(fullPath);
        }
        throw new Error(`File content provider not supplied for relative path: ${relativePath}`);
      },
    };
  }
}
