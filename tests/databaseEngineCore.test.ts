import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DatabaseContextLoader } from '../src/services/database/databaseContextLoader';
import { ItemDatabaseParser } from '../src/services/database/itemDatabaseParser';
import { LayeredItemRepository } from '../src/services/database/layeredItemRepository';
import { ItemDatabaseValidator } from '../src/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '../src/services/database/itemDatabaseSerializer';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';
import { isValidDatabaseVariant, normalizeDatabaseVariant } from '../src/domain/database/common/databaseVariant';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures/rathena/item-db');

describe('Fase 1 — Core Database Engine & item_db.yml', () => {
  const parser = new ItemDatabaseParser();
  const validator = new ItemDatabaseValidator();
  const serializer = new ItemDatabaseSerializer();
  const loader = new DatabaseContextLoader(parser);

  describe('1. Database Variant & Context Selection', () => {
    it('models and validates DatabaseVariant correctly', () => {
      expect(isValidDatabaseVariant('RE')).toBe(true);
      expect(isValidDatabaseVariant('PRE_RE')).toBe(true);
      expect(isValidDatabaseVariant('INVALID')).toBe(false);

      expect(normalizeDatabaseVariant('Renewal')).toBe('RE');
      expect(normalizeDatabaseVariant('re')).toBe('RE');
      expect(normalizeDatabaseVariant('Prerenewal')).toBe('PRE_RE');
      expect(normalizeDatabaseVariant('pre-re')).toBe('PRE_RE');
      expect(normalizeDatabaseVariant('unknown')).toBeNull();
    });

    it('creates explicit DatabaseContext for RE and PRE_RE with standard layer plans', () => {
      const reContext = loader.createContext({ variant: 'RE', workspacePath: '/workspace' });
      expect(reContext.variant).toBe('RE');
      expect(reContext.workspacePath).toBe('/workspace');
      expect(reContext.layers.length).toBeGreaterThan(0);
      expect(reContext.layers.some((l) => l.relativePath.includes('db/re/'))).toBe(true);
      expect(reContext.layers.some((l) => l.relativePath.includes('db/pre-re/'))).toBe(false);

      const preReContext = loader.createContext({ variant: 'PRE_RE' });
      expect(preReContext.variant).toBe('PRE_RE');
      expect(preReContext.layers.some((l) => l.relativePath.includes('db/pre-re/'))).toBe(true);
      expect(preReContext.layers.some((l) => l.relativePath.includes('db/re/'))).toBe(false);
    });

    it('prevents adding an incompatible layer into a repository', () => {
      const reRepo = new LayeredItemRepository('RE');
      const preReLayer: DatabaseLayer = {
        id: 'pre-re-layer',
        name: 'Pre-RE Layer',
        relativePath: 'db/pre-re/item_db.yml',
        variant: 'PRE_RE',
        priority: 200,
        type: 'MODE_SPECIFIC',
      };

      const parsed = parser.parse('Header:\n  Type: ITEM_DB\n  Version: 3\nBody: []', preReLayer);

      expect(() => {
        reRepo.addLayer({
          layer: preReLayer,
          file: parsed.file!,
          adapter: parsed.adapter,
        });
      }).toThrowError(/Cannot add layer "Pre-RE Layer"/);
    });
  });

  describe('2. YamlDocumentAdapter & Parser', () => {
    it('parses valid header and rejects invalid header type or version', () => {
      const validYaml = 'Header:\n  Type: ITEM_DB\n  Version: 3\nBody: []';
      const layer: DatabaseLayer = {
        id: 'test-layer',
        name: 'Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(validYaml, layer);
      expect(result.isValid).toBe(true);
      expect(result.file?.header.type).toBe('ITEM_DB');
      expect(result.file?.header.version).toBe(3);

      const invalidTypeYaml = 'Header:\n  Type: MOB_DB\n  Version: 3\nBody: []';
      const invalidTypeResult = parser.parse(invalidTypeYaml, layer);
      expect(invalidTypeResult.isValid).toBe(false);
      expect(invalidTypeResult.diagnostics.some((d) => d.message.includes('Database type mismatch'))).toBe(true);

      const invalidVersionYaml = 'Header:\n  Type: ITEM_DB\n  Version: 99\nBody: []';
      const invalidVersionResult = parser.parse(invalidVersionYaml, layer);
      expect(invalidVersionResult.isValid).toBe(false);
      expect(invalidVersionResult.diagnostics.some((d) => d.message.includes('Maximum version is 3'))).toBe(true);
    });

    it('parses complex item preserving present keys, ranges and unknown fields', () => {
      const filePath = path.join(FIXTURES_DIR, 'complex_weapon.yml');
      const content = fs.readFileSync(filePath, 'utf-8');
      const layer: DatabaseLayer = {
        id: 'complex-layer',
        name: 'Complex Weapon Layer',
        relativePath: 'complex_weapon.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(content, layer);
      expect(result.isValid).toBe(true);
      expect(result.file?.items.length).toBe(1);

      const item = result.file!.items[0];
      expect(item.id).toBe(1100);
      expect(item.fields.AegisName).toBe('Taurus_Sword_J');
      expect(item.fields.Type).toBe('Weapon');
      expect(item.fields.SubType).toBe('1hSword');
      expect(item.fields.WeaponLevel).toBe(4);
      expect(item.fields.Flags?.DropEffect).toBe('YELLOW_PILLAR');
      expect(item.presentKeys.has('AegisName')).toBe(true);
      expect(item.presentKeys.has('SubType')).toBe(true);
      expect(item.presentKeys.has('MagicAttack')).toBe(false); // Absent in this file!

      expect(item.entityRange).toBeDefined();
      expect(item.fieldRanges.AegisName).toBeDefined();
      expect(item.fieldRanges.Script).toBeDefined();
    });

    it('preserves unknown custom fields without discarding or corrupting them', () => {
      const customYaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    CustomServerAttribute: 42
    InternalAuthor: "GM_Admin"
`;
      const layer: DatabaseLayer = {
        id: 'custom-layer',
        name: 'Custom Layer',
        relativePath: 'custom.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(customYaml, layer);
      expect(result.isValid).toBe(true);
      const item = result.file!.items[0];
      expect(item.unknownFields.CustomServerAttribute).toBe(42);
      expect(item.unknownFields.InternalAuthor).toBe('GM_Admin');
    });
  });

  describe('3. Layered Item Repository & Provenance Tracking', () => {
    it('merges base and import layers applying field-level overrides', () => {
      const repo = new LayeredItemRepository('RE');

      const baseLayer: DatabaseLayer = {
        id: 'base-layer',
        name: 'Base Layer',
        relativePath: 'db/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      };
      const baseYaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Type: Healing
    Buy: 50
    Weight: 70
    Script: |
      itemheal rand(45,65),0;
`;
      const baseParsed = parser.parse(baseYaml, baseLayer);
      repo.addLayer({ layer: baseLayer, file: baseParsed.file!, adapter: baseParsed.adapter });

      const importLayer: DatabaseLayer = {
        id: 'import-layer',
        name: 'Import Layer',
        relativePath: 'db/import/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      };
      const importYaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  # Override Sell & Weight only on 501 without re-declaring AegisName/Name
  - Id: 501
    Sell: 35
    Weight: 40
`;
      const importParsed = parser.parse(importYaml, importLayer);
      repo.addLayer({ layer: importLayer, file: importParsed.file!, adapter: importParsed.adapter });

      const effective = repo.findById(501);
      expect(effective).toBeDefined();
      expect(effective?.id).toBe(501);
      expect(effective?.fields.AegisName).toBe('Red_Potion'); // Retained from base!
      expect(effective?.fields.Name).toBe('Red Potion'); // Retained from base!
      expect(effective?.fields.Type).toBe('Healing'); // Retained from base!
      expect(effective?.fields.Script?.trim()).toBe('itemheal rand(45,65),0;'); // Retained from base!
      expect(effective?.fields.Weight).toBe(40); // Overridden from import!
      expect(effective?.fields.Sell).toBe(35); // Overridden from import!
      expect(effective?.fields.Buy).toBe(50); // Retained from base!

      expect(effective?.isOverridden).toBe(true);
      expect(effective?.layerProvenance).toEqual(['base-layer', 'import-layer']);

      // Check field origins
      expect(effective?.fieldOrigins.AegisName.layerId).toBe('base-layer');
      expect(effective?.fieldOrigins.Weight.layerId).toBe('import-layer');
      expect(effective?.fieldOrigins.Sell.layerId).toBe('import-layer');
    });

    it('handles Header.Clear: true properly in layered sequence', () => {
      const repo = new LayeredItemRepository('RE');

      const layer1: DatabaseLayer = {
        id: 'layer-1',
        name: 'Layer 1',
        relativePath: 'db/layer1.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      };
      const yaml1 = 'Header:\n  Type: ITEM_DB\n  Version: 3\nBody:\n  - Id: 100\n    AegisName: Item_100\n    Name: Item 100\n';
      const parsed1 = parser.parse(yaml1, layer1);
      repo.addLayer({ layer: layer1, file: parsed1.file!, adapter: parsed1.adapter });

      expect(repo.findById(100)).toBeDefined();

      const layer2: DatabaseLayer = {
        id: 'layer-2',
        name: 'Layer 2 (Clear)',
        relativePath: 'db/layer2.yml',
        variant: 'UNIVERSAL',
        priority: 200,
        type: 'CUSTOM',
      };
      const yaml2 = 'Header:\n  Type: ITEM_DB\n  Version: 3\n  Clear: true\nBody:\n  - Id: 200\n    AegisName: Item_200\n    Name: Item 200\n';
      const parsed2 = parser.parse(yaml2, layer2);
      repo.addLayer({ layer: layer2, file: parsed2.file!, adapter: parsed2.adapter });

      expect(repo.findById(100)).toBeUndefined(); // Cleared by Layer 2!
      expect(repo.findById(200)).toBeDefined();
    });
  });

  describe('4. Item Validation Rules', () => {
    it('flags missing required fields on base layer items', () => {
      const layer: DatabaseLayer = {
        id: 'base-layer',
        name: 'Base',
        relativePath: 'base.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = 'Header:\n  Type: ITEM_DB\n  Version: 3\nBody:\n  - Id: 900\n    Type: Etc\n';
      const parsed = parser.parse(yaml, layer);
      const issues = validator.validateSourceItem(parsed.file!.items[0], true);

      expect(issues.some((i) => i.field === 'AegisName' && i.severity === 'error')).toBe(true);
      expect(issues.some((i) => i.field === 'Name' && i.severity === 'error')).toBe(true);
    });

    it('detects Zeny Exploit ratio and overcapped values on EffectiveItem', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'exploit-layer',
        name: 'Exploit Layer',
        relativePath: 'exploit.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 800
    AegisName: Exploit_Item
    Name: Exploit Item
    Buy: 100
    Sell: 95
    Slots: 10
    Range: 50
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(800)!;
      const issues = validator.validateEffectiveItem(item);

      expect(issues.some((i) => i.message.includes('exploit with Discount/Overcharge'))).toBe(true);
      expect(issues.some((i) => i.field === 'Slots')).toBe(true);
      expect(issues.some((i) => i.field === 'Range')).toBe(true);
    });
  });

  describe('5. Document Mutation, Serializer & Round-Trip', () => {
    it('executes in-place field mutation preserving comments, formatting and literal blocks', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'simple_item.yml');
      const rawContent = fs.readFileSync(fixturePath, 'utf-8');
      const layer: DatabaseLayer = {
        id: 'simple-layer',
        name: 'Simple Layer',
        relativePath: 'simple_item.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const parsed = parser.parse(rawContent, layer);
      expect(parsed.isValid).toBe(true);

      // Mutate field
      serializer.updateItemField(parsed.adapter, 0, 'Weight', 90);
      serializer.updateItemField(parsed.adapter, 0, 'Sell', 28);

      const serialized = serializer.serialize(
        { layer, file: parsed.file!, adapter: parsed.adapter },
        'RE'
      );

      // Verify comments intact
      expect(serialized).toContain('# Header');
      expect(serialized).toContain('# Red Potion - Standard healing consumable');
      // Verify values updated
      expect(serialized).toContain('Weight: 90');
      expect(serialized).toContain('Sell: 28');
      // Verify script block preserved as literal block
      expect(serialized).toContain('Script: |');
      expect(serialized).toContain('itemheal rand(45,65),0;');
    });

    it('enforces variant safety during serialization', () => {
      const preReLayer: DatabaseLayer = {
        id: 'pre-re-layer',
        name: 'Pre-RE Layer',
        relativePath: 'pre_re.yml',
        variant: 'PRE_RE',
        priority: 100,
        type: 'BASE',
      };
      const parsed = parser.parse('Header:\n  Type: ITEM_DB\n  Version: 3\nBody: []', preReLayer);

      expect(() => {
        serializer.serialize({ layer: preReLayer, file: parsed.file!, adapter: parsed.adapter }, 'RE');
      }).toThrowError(/Variant safety violation/);
    });
  });

  describe('6. End-to-End Context Loading & Mutation for RE vs PRE_RE', () => {
    it('runs independent full lifecycle for RE context', async () => {
      const reContent = fs.readFileSync(path.join(FIXTURES_DIR, 're/item_db_re.yml'), 'utf-8');
      const importContent = fs.readFileSync(path.join(FIXTURES_DIR, 'import/item_db_override.yml'), 'utf-8');

      const mockProvider = {
        readFile: (relPath: string) => {
          if (relPath.includes('db/re/')) return reContent;
          if (relPath.includes('db/import/')) return importContent;
          return 'Header:\n  Type: ITEM_DB\n  Version: 3\nBody: []';
        },
      };

      const { repository } = await loader.loadRepositoryFromProvider('RE', mockProvider);
      expect(repository.getVariant()).toBe('RE');

      // Item 501 (Red Potion) resolved with import override
      const redPotion = repository.findById(501);
      expect(redPotion).toBeDefined();
      expect(redPotion?.fields.Weight).toBe(50); // From import override
      expect(redPotion?.fields.Sell).toBe(30); // From import override
      expect(redPotion?.fields.Buy).toBe(50); // Preserved from RE base

      // Item 1601 (Rod) with MagicAttack in Renewal
      const rod = repository.findById(1601);
      expect(rod).toBeDefined();
      expect(rod?.fields.MagicAttack).toBe(30);

      // Perform mutation on import layer
      const importLayerData = repository.getLayer('item-db-import')!;
      serializer.updateItemField(importLayerData.adapter, 0, 'Weight', 55);

      const serializedImport = serializer.serialize(importLayerData, 'RE');
      expect(serializedImport).toContain('Weight: 55');
      expect(serializedImport).toContain('CustomTag: "EVENT_REWARD"'); // Unknown field preserved!
    });

    it('runs independent full lifecycle for PRE_RE context', async () => {
      const preReContent = fs.readFileSync(path.join(FIXTURES_DIR, 'pre-re/item_db_pre_re.yml'), 'utf-8');

      const mockProvider = {
        readFile: (relPath: string) => {
          if (relPath.includes('db/pre-re/')) return preReContent;
          return 'Header:\n  Type: ITEM_DB\n  Version: 3\nBody: []';
        },
      };

      const { repository } = await loader.loadRepositoryFromProvider('PRE_RE', mockProvider);
      expect(repository.getVariant()).toBe('PRE_RE');

      const redPotion = repository.findById(501);
      expect(redPotion).toBeDefined();
      expect(redPotion?.databaseVariant).toBe('PRE_RE');
      expect(redPotion?.fields.Weight).toBe(70);

      const rod = repository.findById(1601);
      expect(rod).toBeDefined();
      expect(rod?.fields.MagicAttack).toBeUndefined(); // Pre-Renewal does not have MagicAttack!
    });
  });
});
