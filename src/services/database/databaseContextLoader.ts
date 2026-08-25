import { DatabaseContext } from '../../domain/database/common/databaseContext';
import { DatabaseLayer } from '../../domain/database/common/databaseLayer';
import { DatabaseVariant } from '../../domain/database/common/databaseVariant';
import { ItemDatabaseParser, ItemDatabaseParseResult } from './itemDatabaseParser';
import { LayeredItemRepository } from './layeredItemRepository';

export interface DatabaseContextConfig {
  readonly variant: DatabaseVariant;
  readonly workspacePath?: string;
}

export interface LayerFileContentProvider {
  readFile(relativePath: string): Promise<string> | string;
}

export class DatabaseContextLoader {
  private readonly parser: ItemDatabaseParser;

  public constructor(parser?: ItemDatabaseParser) {
    this.parser = parser || new ItemDatabaseParser();
  }

  public createContext(config: DatabaseContextConfig): DatabaseContext {
    return {
      variant: config.variant,
      layers: this.getStandardLayerPlan(config.variant),
      workspacePath: config.workspacePath,
      loadedAt: new Date(),
    };
  }

  public getStandardLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const isRenewal = variant === 'RE';
    const modeFolder = isRenewal ? 're' : 'pre-re';

    return [
      {
        id: 'item-db-base-root',
        name: 'Item DB Root Header',
        relativePath: 'db/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `item-db-mode-root-${variant.toLowerCase()}`,
        name: `Item DB ${isRenewal ? 'Renewal' : 'Pre-Renewal'} Root`,
        relativePath: `db/${modeFolder}/item_db.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `item-db-usable-${variant.toLowerCase()}`,
        name: `Item DB Usable (${isRenewal ? 'RE' : 'PRE-RE'})`,
        relativePath: `db/${modeFolder}/item_db_usable.yml`,
        variant,
        priority: 250,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `item-db-equip-${variant.toLowerCase()}`,
        name: `Item DB Equip (${isRenewal ? 'RE' : 'PRE-RE'})`,
        relativePath: `db/${modeFolder}/item_db_equip.yml`,
        variant,
        priority: 260,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `item-db-etc-${variant.toLowerCase()}`,
        name: `Item DB Etc (${isRenewal ? 'RE' : 'PRE-RE'})`,
        relativePath: `db/${modeFolder}/item_db_etc.yml`,
        variant,
        priority: 270,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'item-db-import',
        name: 'Item DB Import Override',
        relativePath: 'db/import/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      },
    ];
  }

  public async loadRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredItemRepository;
    parseResults: Record<string, ItemDatabaseParseResult>;
  }> {
    const repository = new LayeredItemRepository(variant);
    const layers = customLayers || this.getStandardLayerPlan(variant);
    const parseResults: Record<string, ItemDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.parser.parse(rawYaml, layer);
        parseResults[layer.id] = parseResult;

        if (parseResult.isValid && parseResult.file) {
          repository.addLayer({
            layer,
            file: parseResult.file,
            adapter: parseResult.adapter,
          });
        }
      } catch (err) {
        // File may not exist yet or failed to read; report in parseResults
        parseResults[layer.id] = {
          adapter: null as unknown as ItemDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }
}
