import { describe, it, expect, beforeEach } from 'vitest';
import { ItemEditTransactionService } from '../src/services/database/itemEditTransactionService';
import { ItemDatabaseValidator } from '../src/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '../src/services/database/itemDatabaseSerializer';
import { MobEditTransactionService } from '../src/services/database/mobEditTransactionService';
import { MobDatabaseValidator } from '../src/services/database/mobDatabaseValidator';
import { MobDatabaseSerializer } from '../src/services/database/mob/mobDatabaseSerializer';
import { SkillEditTransactionService } from '../src/services/database/skillEditTransactionService';
import { SkillDatabaseValidator } from '../src/services/database/skillDatabaseValidator';
import { SkillDatabaseSerializer } from '../src/services/database/skill/skillDatabaseSerializer';
import { FileContentWriter } from '../src/domain/database/workspace/fileContentWriter';
import { ItemDatabaseProvider } from '../src/services/database/providers/itemDatabaseProvider';
import { MobDatabaseProvider } from '../src/services/database/providers/mobDatabaseProvider';
import { SkillDatabaseProvider } from '../src/services/database/providers/skillDatabaseProvider';
import { DatabaseContextLoader, LayerFileContentProvider } from '../src/services/database/databaseContextLoader';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';

class InMemoryFileProvider implements LayerFileContentProvider, FileContentWriter {
  private files = new Map<string, string>();

  public setFile(path: string, content: string) {
    this.files.set(path, content);
  }

  public async readFile(relativePath: string): Promise<string> {
    return this.files.get(relativePath) || '';
  }

  public async writeFile(relativePath: string, content: string): Promise<void> {
    this.files.set(relativePath, content);
  }

  public getWrittenContent(relativePath: string): string | undefined {
    return this.files.get(relativePath);
  }
}

describe('Entity Creation Engine (+1 Item / Mob / Skill)', () => {
  let fileSystem: InMemoryFileProvider;

  beforeEach(() => {
    fileSystem = new InMemoryFileProvider();
  });

  it('creates a new Item in import layer and prevents duplicate IDs and AegisNames', async () => {
    const baseYaml = `
Header:
  Type: ITEM_DB
  Version: 1
Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Type: Usable
`;
    const importYaml = `
Header:
  Type: ITEM_DB
  Version: 1
Body: []
`;
    fileSystem.setFile('db/re/item_db.yml', baseYaml);
    fileSystem.setFile('db/import/item_db.yml', importYaml);

    const layers: DatabaseLayer[] = [
      { id: 'item-db-base', name: 'Base', relativePath: 'db/re/item_db.yml', priority: 100, variant: 'RE', type: 'BASE' },
      { id: 'item-db-import', name: 'Import', relativePath: 'db/import/item_db.yml', priority: 200, variant: 'RE', type: 'IMPORT' },
    ];

    const loader = new DatabaseContextLoader();
    const provider = new ItemDatabaseProvider(loader, () => fileSystem);
    await provider.load({ variant: 'RE', layers, workspacePath: '/mock', loadedAt: new Date() });

    const validator = new ItemDatabaseValidator();
    const serializer = new ItemDatabaseSerializer();
    const service = new ItemEditTransactionService(validator, serializer, fileSystem);

    // 1. Reject duplicate ID
    await expect(
      service.createItem(
        { Id: 501, AegisName: 'Custom_Potion', Name: 'Custom Potion', Type: 'Usable' },
        'item-db-import',
        provider
      )
    ).rejects.toThrow(/Item ID 501 already exists/i);

    // 2. Reject duplicate AegisName
    await expect(
      service.createItem(
        { Id: 20001, AegisName: 'Red_Potion', Name: 'Another Potion', Type: 'Usable' },
        'item-db-import',
        provider
      )
    ).rejects.toThrow(/Item AegisName "Red_Potion" already exists/i);

    // 3. Successfully create new item
    await service.createItem(
      { Id: 20001, AegisName: 'Custom_Sword', Name: 'Custom Sword', Type: 'Weapon', SubType: '1hSword' },
      'item-db-import',
      provider
    );

    const repo = provider.getRepository()!;
    const createdItem = repo.findById(20001);
    expect(createdItem).toBeDefined();
    expect(createdItem?.fields.Name).toBe('Custom Sword');
    expect(createdItem?.fields.Type).toBe('Weapon');

    // Verify written YAML contains the new item
    const writtenYaml = fileSystem.getWrittenContent('db/import/item_db.yml');
    expect(writtenYaml).toContain('Custom_Sword');
    expect(writtenYaml).toContain('20001');
  });

  it('creates a new Monster in import layer and validates uniqueness', async () => {
    const baseYaml = `
Header:
  Type: MOB_DB
  Version: 3
Body:
  - Id: 1002
    AegisName: PORING
    Name: Poring
    Hp: 50
`;
    const importYaml = `
Header:
  Type: MOB_DB
  Version: 3
Body: []
`;
    fileSystem.setFile('db/re/mob_db.yml', baseYaml);
    fileSystem.setFile('db/import/mob_db.yml', importYaml);

    const layers: DatabaseLayer[] = [
      { id: 'mob-db-base', name: 'Base', relativePath: 'db/re/mob_db.yml', priority: 100, variant: 'RE', type: 'BASE' },
      { id: 'mob-db-import', name: 'Import', relativePath: 'db/import/mob_db.yml', priority: 200, variant: 'RE', type: 'IMPORT' },
    ];

    const loader = new DatabaseContextLoader();
    const provider = new MobDatabaseProvider(loader, () => fileSystem);
    await provider.load({ variant: 'RE', layers, workspacePath: '/mock', loadedAt: new Date() });

    const validator = new MobDatabaseValidator();
    const serializer = new MobDatabaseSerializer();
    const service = new MobEditTransactionService(validator, serializer, fileSystem);

    // 1. Reject duplicate ID
    await expect(
      service.createMob(
        { Id: 1002, AegisName: 'CUSTOM_MOB', Name: 'Custom Mob' },
        'mob-db-import',
        provider
      )
    ).rejects.toThrow(/Monster ID 1002 already exists/i);

    // 2. Reject duplicate AegisName
    await expect(
      service.createMob(
        { Id: 3001, AegisName: 'PORING', Name: 'Another Poring' },
        'mob-db-import',
        provider
      )
    ).rejects.toThrow(/Monster AegisName "PORING" already exists/i);

    // 3. Successfully create new mob
    await service.createMob(
      { Id: 3001, AegisName: 'GOLDEN_PORING', Name: 'Golden Poring', Level: 50, Hp: 15000 },
      'mob-db-import',
      provider
    );

    const repo = provider.getRepository()!;
    const createdMob = repo.findById(3001);
    expect(createdMob).toBeDefined();
    expect(createdMob?.fields.Name).toBe('Golden Poring');
    expect(createdMob?.fields.Hp).toBe(15000);
  });

  it('creates a new Skill in import layer and validates uniqueness', async () => {
    const baseYaml = `
Header:
  Type: SKILL_DB
  Version: 3
Body:
  - Id: 1
    Name: NV_BASIC
    Description: Basic Skill
    MaxLevel: 9
`;
    const importYaml = `
Header:
  Type: SKILL_DB
  Version: 3
Body: []
`;
    fileSystem.setFile('db/re/skill_db.yml', baseYaml);
    fileSystem.setFile('db/import/skill_db.yml', importYaml);

    const layers: DatabaseLayer[] = [
      { id: 'skill-db-base', name: 'Base', relativePath: 'db/re/skill_db.yml', priority: 100, variant: 'RE', type: 'BASE' },
      { id: 'skill-db-import', name: 'Import', relativePath: 'db/import/skill_db.yml', priority: 200, variant: 'RE', type: 'IMPORT' },
    ];

    const loader = new DatabaseContextLoader();
    const provider = new SkillDatabaseProvider(loader, () => fileSystem);
    await provider.load({ variant: 'RE', layers, workspacePath: '/mock', loadedAt: new Date() });

    const validator = new SkillDatabaseValidator();
    const serializer = new SkillDatabaseSerializer();
    const service = new SkillEditTransactionService(validator, serializer, fileSystem);

    // 1. Reject duplicate ID
    await expect(
      service.createSkill(
        { Id: 1, Name: 'CUSTOM_SKILL', Description: 'Custom Skill' },
        'skill-db-import',
        provider
      )
    ).rejects.toThrow(/Skill ID 1 already exists/i);

    // 2. Reject duplicate Name
    await expect(
      service.createSkill(
        { Id: 8501, Name: 'NV_BASIC', Description: 'Another Basic Skill' },
        'skill-db-import',
        provider
      )
    ).rejects.toThrow(/Skill AegisName "NV_BASIC" already exists/i);

    // 3. Successfully create new skill
    await service.createSkill(
      { Id: 8501, Name: 'CUSTOM_FIRE_EXPLOSION', Description: 'Fire Explosion', MaxLevel: 10, Type: 'Magic' },
      'skill-db-import',
      provider
    );

    const repo = provider.getRepository()!;
    const createdSkill = repo.findById(8501);
    expect(createdSkill).toBeDefined();
    expect(createdSkill?.fields.Description).toBe('Fire Explosion');
    expect(createdSkill?.fields.Type).toBe('Magic');
  });
});
