import { DatabaseProvider, DatabaseMetadata, DatabaseProviderId } from '../../../domain/database/provider/databaseProvider';
import { DatabaseContext } from '../../../domain/database/common/databaseContext';
import { DatabaseContextLoader } from '../databaseContextLoader';
import { LayeredComboRepository } from '../combo/layeredComboRepository';
import { TauriLayerFileContentProvider } from './tauriLayerFileContentProvider';
import { FileContentProviderFactory } from './itemDatabaseProvider';

export class ComboDatabaseProvider implements DatabaseProvider<LayeredComboRepository> {
  public readonly id: DatabaseProviderId = 'combo';
  public readonly name = 'Item Combos';

  private repository?: LayeredComboRepository;
  private state: DatabaseMetadata['state'] = 'not_loaded';
  private error?: Error;
  private lastLoaded?: Date;
  private loadedFiles: string[] = [];
  private lastContext?: DatabaseContext;

  constructor(
    private loader: DatabaseContextLoader,
    private providerFactory: FileContentProviderFactory = (path) => new TauriLayerFileContentProvider(path)
  ) {}

  public getMetadata(): DatabaseMetadata {
    return {
      id: this.id,
      name: this.name,
      entityCount: this.repository ? this.repository.getAllEffectiveCombos().length : 0,
      loadedFiles: this.loadedFiles,
      lastLoaded: this.lastLoaded,
      state: this.state,
      error: this.error,
    };
  }

  public async load(context: DatabaseContext): Promise<void> {
    if (!context.workspacePath) {
      throw new Error('Workspace path is required to load Item Combos Database.');
    }

    this.lastContext = context;
    this.state = 'loading';
    this.error = undefined;

    try {
      const provider = this.providerFactory(context.workspacePath);
      const { repository, parseResults } = await this.loader.loadComboRepositoryFromProvider(
        context.variant,
        provider,
        context.layers
      );

      this.repository = repository;
      this.loadedFiles = Object.values(parseResults)
        .filter((r) => r.isValid && r.file)
        .map((r) => r.file!.layer.relativePath);
      this.lastLoaded = new Date();
      this.state = 'loaded';
    } catch (e) {
      this.state = 'error';
      this.error = e instanceof Error ? e : new Error(String(e));
      throw this.error;
    }
  }

  public async reloadLayer(layerId: string): Promise<void> {
    if (!this.repository || !this.lastContext?.workspacePath) {
      throw new Error('Provider not fully loaded');
    }

    const layerDef = this.lastContext.layers.find((l) => l.id === layerId);
    if (!layerDef) {
      throw new Error(`Layer definition not found for ${layerId}`);
    }

    const fileProvider = this.providerFactory(this.lastContext.workspacePath);
    const partialResult = await this.loader.loadComboRepositoryFromProvider(this.lastContext.variant, fileProvider, [layerDef]);
    const parsedLayer = partialResult.parseResults[layerId];

    if (parsedLayer && parsedLayer.isValid && parsedLayer.file) {
      this.repository.addLayer({
        layer: layerDef,
        file: parsedLayer.file,
        adapter: parsedLayer.adapter,
      });
    }
  }

  public getRepository(): LayeredComboRepository | undefined {
    return this.repository;
  }
}
