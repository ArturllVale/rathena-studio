import { DatabaseProvider, DatabaseMetadata, DatabaseProviderId } from '../../../domain/database/provider/databaseProvider';
import { DatabaseContext } from '../../../domain/database/common/databaseContext';
import { DatabaseContextLoader } from '../databaseContextLoader';
import { LayeredRandomOptRepository } from '../randomOpt/layeredRandomOptRepository';
import { TauriLayerFileContentProvider } from './tauriLayerFileContentProvider';
import { FileContentProviderFactory } from './itemDatabaseProvider';

export class RandomOptDatabaseProvider implements DatabaseProvider<LayeredRandomOptRepository> {
  public readonly id: DatabaseProviderId = 'randomopt';
  public readonly name = 'Random Options';

  private repository?: LayeredRandomOptRepository;
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
    const optCount = this.repository ? this.repository.getAllEffectiveOptions().length : 0;
    const grpCount = this.repository ? this.repository.getAllEffectiveGroups().length : 0;
    return {
      id: this.id,
      name: this.name,
      entityCount: optCount + grpCount,
      loadedFiles: this.loadedFiles,
      lastLoaded: this.lastLoaded,
      state: this.state,
      error: this.error,
    };
  }

  public async load(context: DatabaseContext): Promise<void> {
    if (!context.workspacePath) {
      throw new Error('Workspace path is required to load Random Options Database.');
    }

    this.lastContext = context;
    this.state = 'loading';
    this.error = undefined;

    try {
      const provider = this.providerFactory(context.workspacePath);
      const { repository, parseResults } = await this.loader.loadRandomOptRepositoryFromProvider(
        context.variant,
        provider,
        context.layers
      );

      this.repository = repository;
      this.loadedFiles = Object.values(parseResults)
        .filter((r) => r.isValid && (r.optionFile || r.groupFile))
        .map((r) => (r.optionFile ? r.optionFile.layer.relativePath : r.groupFile!.layer.relativePath));
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
    const partialResult = await this.loader.loadRandomOptRepositoryFromProvider(this.lastContext.variant, fileProvider, [layerDef]);
    const parsedLayer = partialResult.parseResults[layerId];

    if (parsedLayer && parsedLayer.isValid) {
      if (parsedLayer.optionFile) {
        this.repository.addOptionLayer({
          layer: layerDef,
          file: parsedLayer.optionFile,
          adapter: parsedLayer.adapter,
        });
      }
      if (parsedLayer.groupFile) {
        this.repository.addGroupLayer({
          layer: layerDef,
          file: parsedLayer.groupFile,
          adapter: parsedLayer.adapter,
        });
      }
    }
  }

  public getRepository(): LayeredRandomOptRepository | undefined {
    return this.repository;
  }
}
