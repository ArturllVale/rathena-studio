import { DatabaseVariant } from '../../domain/database/common/databaseVariant';
import { DatabaseLayer } from '../../domain/database/common/databaseLayer';
import { DatabaseContext } from '../../domain/database/common/databaseContext';
import { LayeredItemRepository } from './layeredItemRepository';
import { ItemDatabaseParser, ItemDatabaseParseResult } from './itemDatabaseParser';
import { LayeredMobRepository } from './mob/layeredMobRepository';
import { MobDatabaseParser, MobDatabaseParseResult } from './mob/mobDatabaseParser';
import { LayeredSkillRepository } from './skill/layeredSkillRepository';
import { SkillDatabaseParser, SkillDatabaseParseResult } from './skill/skillDatabaseParser';
import { LayeredComboRepository } from './combo/layeredComboRepository';
import { ComboDatabaseParser, ComboDatabaseParseResult } from './combo/comboDatabaseParser';
import { LayeredItemGroupRepository } from './itemGroup/layeredItemGroupRepository';
import { ItemGroupDatabaseParser, ItemGroupDatabaseParseResult } from './itemGroup/itemGroupDatabaseParser';
import { LayeredItemPackageRepository } from './itemPackage/layeredItemPackageRepository';
import { ItemPackageDatabaseParser, ItemPackageDatabaseParseResult } from './itemPackage/itemPackageDatabaseParser';
import { LayeredRandomOptRepository } from './randomOpt/layeredRandomOptRepository';
import { RandomOptDatabaseParser, RandomOptDatabaseParseResult } from './randomOpt/randomOptDatabaseParser';

export interface LayerFileContentProvider {
  readFile(relativePath: string): Promise<string | null> | string | null;
  fileExists?(relativePath: string): Promise<boolean> | boolean;
}

export class DatabaseContextLoader {
  private itemParser: ItemDatabaseParser;
  private mobParser: MobDatabaseParser;
  private skillParser: SkillDatabaseParser;
  private comboParser: ComboDatabaseParser;
  private itemGroupParser: ItemGroupDatabaseParser;
  private itemPackageParser: ItemPackageDatabaseParser;
  private randomOptParser: RandomOptDatabaseParser;

  public constructor(
    itemParser?: ItemDatabaseParser,
    mobParser?: MobDatabaseParser,
    skillParser?: SkillDatabaseParser,
    comboParser?: ComboDatabaseParser,
    itemGroupParser?: ItemGroupDatabaseParser,
    itemPackageParser?: ItemPackageDatabaseParser,
    randomOptParser?: RandomOptDatabaseParser
  ) {
    this.itemParser = itemParser || new ItemDatabaseParser();
    this.mobParser = mobParser || new MobDatabaseParser();
    this.skillParser = skillParser || new SkillDatabaseParser();
    this.comboParser = comboParser || new ComboDatabaseParser();
    this.itemGroupParser = itemGroupParser || new ItemGroupDatabaseParser();
    this.itemPackageParser = itemPackageParser || new ItemPackageDatabaseParser();
    this.randomOptParser = randomOptParser || new RandomOptDatabaseParser();
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

  public getStandardComboLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'combo-db-base-root',
        name: 'Combo DB Base',
        relativePath: 'db/item_combos.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `combo-db-mode-${variant.toLowerCase()}`,
        name: `Combo DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/item_combos.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'combo-db-import',
        name: 'Combo DB Import Override',
        relativePath: 'db/import/item_combos.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      },
    ];
  }

  public getStandardItemGroupLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'item-group-db-base-root',
        name: 'Item Group DB Base',
        relativePath: 'db/item_group_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `item-group-db-mode-${variant.toLowerCase()}`,
        name: `Item Group DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/item_group_db.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'item-group-db-import',
        name: 'Item Group DB Import Override',
        relativePath: 'db/import/item_group_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      },
    ];
  }

  public getStandardItemPackageLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'item-package-db-base-root',
        name: 'Item Package DB Base',
        relativePath: 'db/item_packages.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: `item-package-db-mode-${variant.toLowerCase()}`,
        name: `Item Package DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/item_packages.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'item-package-db-import',
        name: 'Item Package DB Import Override',
        relativePath: 'db/import/item_packages.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      },
    ];
  }

  public getStandardRandomOptLayerPlan(variant: DatabaseVariant): readonly DatabaseLayer[] {
    const modeFolder = variant === 'RE' ? 're' : 'pre-re';

    return [
      {
        id: 'randomopt-db-base-root',
        name: 'Random Option DB Base',
        relativePath: 'db/item_randomopt_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      },
      {
        id: 'randomopt-grp-db-base-root',
        name: 'Random Option Group DB Base',
        relativePath: 'db/item_randomopt_group.yml',
        variant: 'UNIVERSAL',
        priority: 110,
        type: 'BASE',
      },
      {
        id: `randomopt-db-mode-${variant.toLowerCase()}`,
        name: `Random Option DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/item_randomopt_db.yml`,
        variant,
        priority: 200,
        type: 'MODE_SPECIFIC',
      },
      {
        id: `randomopt-grp-db-mode-${variant.toLowerCase()}`,
        name: `Random Option Group DB Mode (${variant})`,
        relativePath: `db/${modeFolder}/item_randomopt_group.yml`,
        variant,
        priority: 210,
        type: 'MODE_SPECIFIC',
      },
      {
        id: 'randomopt-db-import',
        name: 'Random Option DB Import Override',
        relativePath: 'db/import/item_randomopt_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      },
      {
        id: 'randomopt-grp-db-import',
        name: 'Random Option Group DB Import Override',
        relativePath: 'db/import/item_randomopt_group.yml',
        variant: 'UNIVERSAL',
        priority: 310,
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

  public async loadComboRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredComboRepository;
    parseResults: Record<string, ComboDatabaseParseResult>;
  }> {
    const repository = new LayeredComboRepository(variant);
    const layers = customLayers || this.getStandardComboLayerPlan(variant);
    const parseResults: Record<string, ComboDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.comboParser.parse(rawYaml, layer);
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
          adapter: null as unknown as ComboDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load combo layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }

  public async loadItemGroupRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredItemGroupRepository;
    parseResults: Record<string, ItemGroupDatabaseParseResult>;
  }> {
    const repository = new LayeredItemGroupRepository(variant);
    const layers = customLayers || this.getStandardItemGroupLayerPlan(variant);
    const parseResults: Record<string, ItemGroupDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.itemGroupParser.parse(rawYaml, layer);
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
          adapter: null as unknown as ItemGroupDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load item group layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }

  public async loadItemPackageRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredItemPackageRepository;
    parseResults: Record<string, ItemPackageDatabaseParseResult>;
  }> {
    const repository = new LayeredItemPackageRepository(variant);
    const layers = customLayers || this.getStandardItemPackageLayerPlan(variant);
    const parseResults: Record<string, ItemPackageDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.itemPackageParser.parse(rawYaml, layer);
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
          adapter: null as unknown as ItemPackageDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load item package layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }

  public async loadRandomOptRepositoryFromProvider(
    variant: DatabaseVariant,
    provider: LayerFileContentProvider,
    customLayers?: readonly DatabaseLayer[]
  ): Promise<{
    repository: LayeredRandomOptRepository;
    parseResults: Record<string, RandomOptDatabaseParseResult>;
  }> {
    const repository = new LayeredRandomOptRepository(variant);
    const layers = customLayers || this.getStandardRandomOptLayerPlan(variant);
    const parseResults: Record<string, RandomOptDatabaseParseResult> = {};

    for (const layer of layers) {
      if (layer.variant !== 'UNIVERSAL' && layer.variant !== variant) {
        continue;
      }

      try {
        const rawYaml = await provider.readFile(layer.relativePath);
        if (!rawYaml || rawYaml.trim() === '') {
          continue;
        }

        const parseResult = this.randomOptParser.parse(rawYaml, layer);
        parseResults[layer.id] = parseResult;

        if (parseResult.isValid) {
          if (parseResult.optionFile) {
            repository.addOptionLayer({
              layer,
              file: parseResult.optionFile,
              adapter: parseResult.adapter,
            });
          }
          if (parseResult.groupFile) {
            repository.addGroupLayer({
              layer,
              file: parseResult.groupFile,
              adapter: parseResult.adapter,
            });
          }
        }
      } catch (err) {
        parseResults[layer.id] = {
          adapter: null as unknown as RandomOptDatabaseParseResult['adapter'],
          diagnostics: [
            {
              severity: 'warning',
              message: `Could not load random option layer file "${layer.relativePath}": ${(err as Error).message}`,
            },
          ],
          isValid: false,
        };
      }
    }

    return { repository, parseResults };
  }
}
