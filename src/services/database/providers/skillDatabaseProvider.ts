import { DatabaseProvider, DatabaseMetadata, DatabaseProviderId } from '../../../domain/database/provider/databaseProvider';
import { DatabaseContext } from '../../../domain/database/common/databaseContext';
import { DatabaseContextLoader, LayerFileContentProvider } from '../databaseContextLoader';
import { LayeredSkillRepository } from '../skill/layeredSkillRepository';
import { TauriLayerFileContentProvider } from './tauriLayerFileContentProvider';

export type SkillFileContentProviderFactory = (workspacePath: string) => LayerFileContentProvider;

export class SkillDatabaseProvider implements DatabaseProvider<LayeredSkillRepository> {
  public readonly id: DatabaseProviderId = 'skill';
  public readonly name = 'Skill Database';

  private repository?: LayeredSkillRepository;
  private state: DatabaseMetadata['state'] = 'not_loaded';
  private error?: Error;
  private lastLoaded?: Date;
  private loadedFiles: string[] = [];
  private lastContext?: DatabaseContext;

  constructor(
    private loader: DatabaseContextLoader,
    private providerFactory: SkillFileContentProviderFactory = (path) => new TauriLayerFileContentProvider(path)
  ) {}

  public getMetadata(): DatabaseMetadata {
    return {
      id: this.id,
      name: this.name,
      entityCount: this.repository ? this.repository.getAllEffectiveSkills().length : 0,
      loadedFiles: this.loadedFiles,
      lastLoaded: this.lastLoaded,
      state: this.state,
      error: this.error,
    };
  }

  public async load(context: DatabaseContext): Promise<void> {
    if (!context.workspacePath) {
      throw new Error('Workspace path is required to load Skill Database.');
    }

    this.lastContext = context;
    this.state = 'loading';
    this.error = undefined;

    try {
      const fileProvider = this.providerFactory(context.workspacePath);
      const skillLayers = this.loader.getStandardSkillLayerPlan(context.variant);
      const { repository, parseResults } = await this.loader.loadSkillRepositoryFromProvider(
        context.variant,
        fileProvider,
        skillLayers
      );

      this.repository = repository;
      this.loadedFiles = Object.values(parseResults)
        .filter((r) => r.isValid && r.file)
        .map((r) => r.file!.skills.values().next().value?.sourceFilePath || 'skill_db.yml');
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

    const layerDefs = this.loader.getStandardSkillLayerPlan(this.lastContext.variant);
    const layerDef = layerDefs.find((l) => l.id === layerId);
    if (!layerDef) {
      throw new Error(`Layer definition not found for ${layerId}`);
    }

    const fileProvider = this.providerFactory(this.lastContext.workspacePath);
    const rawYaml = await fileProvider.readFile(layerDef.relativePath);
    if (!rawYaml || rawYaml.trim() === '') {
      return;
    }

    const partialResult = await this.loader.loadSkillRepositoryFromProvider(
      this.lastContext.variant,
      fileProvider,
      [layerDef]
    );
    const parsedLayer = partialResult.parseResults[layerId];

    if (parsedLayer && parsedLayer.isValid && parsedLayer.file) {
      this.repository.addLayer({
        layer: layerDef,
        file: parsedLayer.file,
        adapter: parsedLayer.adapter,
      });
    }
  }

  public getRepository(): LayeredSkillRepository | undefined {
    return this.repository;
  }
}
