import { DatabaseVariant } from '../../domain/database/common/databaseVariant';
import { DatabaseLayer } from '../../domain/database/common/databaseLayer';
import { DatabaseContext } from '../../domain/database/common/databaseContext';
import { LayeredItemRepository } from './layeredItemRepository';
import { ItemDatabaseParser, ItemDatabaseParseResult } from './itemDatabaseParser';
import { LayeredMobRepository } from './mob/layeredMobRepository';
import { MobDatabaseParser, MobDatabaseParseResult } from './mob/mobDatabaseParser';
import { LayeredSkillRepository } from './skill/layeredSkillRepository';
import { SkillDatabaseParser, SkillDatabaseParseResult } from './skill/skillDatabaseParser';

export interface LayerFileContentProvider {
  readFile(relativePath: string): Promise<string | null> | string | null;
  fileExists?(relativePath: string): Promise<boolean> | boolean;
}

export class DatabaseContextLoader {
  private itemParser: ItemDatabaseParser;
  private mobParser: MobDatabaseParser;
  private skillParser: SkillDatabaseParser;

  public constructor(
    itemParser?: ItemDatabaseParser,
    mobParser?: MobDatabaseParser,
    skillParser?: SkillDatabaseParser
  ) {
    this.itemParser = itemParser || new ItemDatabaseParser();
    this.mobParser = mobParser || new MobDatabaseParser();
    this.skillParser = skillParser || new SkillDatabaseParser();
  }

  public createContext(params: {
    variant: DatabaseVariant;
    workspacePath?: string;
    customLayers?: DatabaseLayer[];
  }): DatabaseContext {
    return {
      variant: params.variant,
      workspacePath: params.workspacePath,
      layers: params.customLayers || this.getStandardLayerPlan(params.variant),
      loadedAt: new Date(),
    };
  }

  public getStandardLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'item-db-base-root',
        name: 'Item DB Base',
        relativePath: 'db/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `item-db-mode-root-${variant.toLowerCase()}`,
        name: `Item DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/item_db.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `item-db-${variant.toLowerCase()}-usable`,
        name: `Item DB Usable (${variant})`,
        relativePath: `db/${modeFolder}/item_db_usable.yml`,
        variant,
        priority: 210,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `item-db-${variant.toLowerCase()}-equip`,
        name: `Item DB Equip (${variant})`,
        relativePath: `db/${modeFolder}/item_db_equip.yml`,
        variant,
        priority: 220,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `item-db-${variant.toLowerCase()}-etc`,
        name: `Item DB Etc (${variant})`,
        relativePath: `db/${modeFolder}/item_db_etc.yml`,
        variant,
        priority: 230,
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

  public getStandardMobLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'mob-db-base-root',
        name: 'Mob DB Base',
        relativePath: 'db/mob_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `mob-db-mode-root-${variant.toLowerCase()}`,
        name: `Mob DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/mob_db.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'mob-db-import',
        name: 'Mob DB Import Override',
        relativePath: 'db/import/mob_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      },
    ];
  }

  public getStandardSkillLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'skill-db-base-root',
        name: 'Skill DB Base',
        relativePath: 'db/skill_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `skill-db-mode-root-${variant.toLowerCase()}`,
        name: `Skill DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/skill_db.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'skill-db-import',
        name: 'Skill DB Import Override',
        relativePath: 'db/import/skill_db.yml',
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

        const parseResult = this.itemParser.parse(rawYaml, layer);
        parseResults[layer.id] = parseResult;

        if (parseResult.isValid && parseResult.file) {
          repository.addLayer({
            layer,
            file: parseResult.file,
            adapter: parseResult.adapter,
          });
        }
      } catch (err) {
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

  public async loadMobRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredMobRepository;
    parseResults: Record<string, MobDatabaseParseResult>;
  }> {
    const repository = new LayeredMobRepository(variant);
    const layers = customLayers || this.getStandardMobLayerPlan(variant);
    const parseResults: Record<string, MobDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.mobParser.parse(rawYaml, layer);
        parseResults[layer.id] = parseResult;

        if (parseResult.isValid && parseResult.file) {
          repository.addLayer({
            layer,
            file: parseResult.file,
            adapter: parseResult.adapter,
          });
        }
      } catch (err) {
        parseResults[layer.id] = {
          adapter: null as unknown as MobDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load monster layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }

  public async loadSkillRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredSkillRepository;
    parseResults: Record<string, SkillDatabaseParseResult>;
  }> {
    const repository = new LayeredSkillRepository(variant);
    const layers = customLayers || this.getStandardSkillLayerPlan(variant);
    const parseResults: Record<string, SkillDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.skillParser.parse(rawYaml, layer);
        parseResults[layer.id] = parseResult;

        if (parseResult.isValid && parseResult.file) {
          repository.addLayer({
            layer,
            file: parseResult.file,
            adapter: parseResult.adapter,
          });
        }
      } catch (err) {
        parseResults[layer.id] = {
          adapter: null as unknown as SkillDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load skill layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }
}
