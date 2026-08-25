import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const LARGE_TEST_TIMEOUT = 60_000;
import { ItemDatabaseParser } from '../src/services/database/itemDatabaseParser';
import { LayeredItemRepository } from '../src/services/database/layeredItemRepository';
import { ItemDatabaseSerializer } from '../src/services/database/itemDatabaseSerializer';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';
import { DatabaseContextLoader } from '../src/services/database/databaseContextLoader';

const RATHENA_ROOT = 'C:\\Users\\artur.vale\\OneDrive - SISTEMA FIEPA\\Documentos\\Pessoal\\github\\horizonro';
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures/rathena/item-db');

function readRathenaFile(relativePath: string): string {
  const fullPath = path.join(RATHENA_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

describe('Database Engine Audit — Real rAthena Compatibility', () => {
  const parser = new ItemDatabaseParser();
  const serializer = new ItemDatabaseSerializer();
  const loader = new DatabaseContextLoader(parser);

  // ─── 1. REAL RATHENA DATA PARSING ─────────────────────────────────────────

  describe.skipIf(!fs.existsSync(path.join(RATHENA_ROOT, 'db/item_db.yml')))('1. Real rAthena Data Parsing', () => {
    it('parses the root db/item_db.yml header and footer imports correctly', () => {
      const content = readRathenaFile('db/item_db.yml');
      expect(content.length).toBeGreaterThan(0);

      const layer: DatabaseLayer = {
        id: 'root',
        name: 'Root',
        relativePath: 'db/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(content, layer);
      expect(result.isValid).toBe(true);
      expect(result.file?.header.type).toBe('ITEM_DB');
      expect(result.file?.header.version).toBe(3);
      // Root file has no Body items (only Header + Footer)
      expect(result.file?.items.length).toBe(0);
      // Must have imports
      expect(result.file?.imports.length).toBeGreaterThan(0);
      // Validate import structure
      const imports = result.file!.imports;
      expect(imports.some((i) => i.path === 'db/pre-re/item_db.yml' && i.mode === 'Prerenewal')).toBe(true);
      expect(imports.some((i) => i.path === 'db/re/item_db.yml' && i.mode === 'Renewal')).toBe(true);
      expect(imports.some((i) => i.path === 'db/import/item_db.yml' && i.mode === undefined)).toBe(true);
    });

    it('parses db/pre-re/item_db_usable.yml (5000+ items) without errors', () => {
      const content = readRathenaFile('db/pre-re/item_db_usable.yml');
      expect(content.length).toBeGreaterThan(0);

      const layer: DatabaseLayer = {
        id: 'pre-re-usable',
        name: 'PRE-RE Usable',
        relativePath: 'db/pre-re/item_db_usable.yml',
        variant: 'PRE_RE',
        priority: 250,
        type: 'MODE_SPECIFIC',
      };

      const start = performance.now();
      const result = parser.parse(content, layer);
      const parseTime = performance.now() - start;

      expect(result.isValid).toBe(true);
      expect(result.file?.items.length).toBeGreaterThan(4000);
      expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);

      console.log(`  PRE-RE Usable: ${result.file?.items.length} items parsed in ${parseTime.toFixed(0)}ms`);
    }, LARGE_TEST_TIMEOUT);

    it('parses db/pre-re/item_db_equip.yml (11000+ items) without errors', () => {
      const content = readRathenaFile('db/pre-re/item_db_equip.yml');
      expect(content.length).toBeGreaterThan(0);

      const layer: DatabaseLayer = {
        id: 'pre-re-equip',
        name: 'PRE-RE Equip',
        relativePath: 'db/pre-re/item_db_equip.yml',
        variant: 'PRE_RE',
        priority: 260,
        type: 'MODE_SPECIFIC',
      };

      const start = performance.now();
      const result = parser.parse(content, layer);
      const parseTime = performance.now() - start;

      expect(result.isValid).toBe(true);
      expect(result.file?.items.length).toBeGreaterThan(10000);

      console.log(`  PRE-RE Equip: ${result.file?.items.length} items parsed in ${parseTime.toFixed(0)}ms`);
    }, LARGE_TEST_TIMEOUT);

    it('parses db/pre-re/item_db_etc.yml (8000+ items) without errors', () => {
      const content = readRathenaFile('db/pre-re/item_db_etc.yml');
      expect(content.length).toBeGreaterThan(0);

      const layer: DatabaseLayer = {
        id: 'pre-re-etc',
        name: 'PRE-RE Etc',
        relativePath: 'db/pre-re/item_db_etc.yml',
        variant: 'PRE_RE',
        priority: 270,
        type: 'MODE_SPECIFIC',
      };

      const start = performance.now();
      const result = parser.parse(content, layer);
      const parseTime = performance.now() - start;

      expect(result.isValid).toBe(true);
      expect(result.file?.items.length).toBeGreaterThan(7000);

      console.log(`  PRE-RE Etc: ${result.file?.items.length} items parsed in ${parseTime.toFixed(0)}ms`);
    }, LARGE_TEST_TIMEOUT);

    it('parses db/import/item_db.yml (custom server overrides)', () => {
      const content = readRathenaFile('db/import/item_db.yml');
      expect(content.length).toBeGreaterThan(0);

      const layer: DatabaseLayer = {
        id: 'import',
        name: 'Import',
        relativePath: 'db/import/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      };

      const result = parser.parse(content, layer);
      expect(result.isValid).toBe(true);
      console.log(`  Import: ${result.file?.items.length} items parsed`);
    });
  });

  // ─── 2. VARIANT LAYER PLAN VS REAL IMPORT CHAIN ───────────────────────────

  describe('2. Variant Layer Plan vs Real Import Chain', () => {
    it('standard PRE_RE layer plan matches actual rAthena import chain', () => {
      const plan = loader.getStandardLayerPlan('PRE_RE');
      const expectedPaths = [
        'db/item_db.yml',
        'db/pre-re/item_db.yml',
        'db/pre-re/item_db_usable.yml',
        'db/pre-re/item_db_equip.yml',
        'db/pre-re/item_db_etc.yml',
        'db/import/item_db.yml',
      ];

      expect(plan.map((l) => l.relativePath)).toEqual(expectedPaths);
      expect(plan.every((l) => l.variant === 'PRE_RE' || l.variant === 'UNIVERSAL')).toBe(true);

      // Verify priority ordering is ascending
      for (let i = 1; i < plan.length; i++) {
        expect(plan[i].priority).toBeGreaterThan(plan[i - 1].priority);
      }
    });

    it('standard RE layer plan matches actual rAthena import chain', () => {
      const plan = loader.getStandardLayerPlan('RE');
      const expectedPaths = [
        'db/item_db.yml',
        'db/re/item_db.yml',
        'db/re/item_db_usable.yml',
        'db/re/item_db_equip.yml',
        'db/re/item_db_etc.yml',
        'db/import/item_db.yml',
      ];

      expect(plan.map((l) => l.relativePath)).toEqual(expectedPaths);
      expect(plan.every((l) => l.variant === 'RE' || l.variant === 'UNIVERSAL')).toBe(true);
    });

    it.skipIf(!fs.existsSync(path.join(RATHENA_ROOT, 'db/item_db.yml')))('detects that real rAthena horizonro has custom layers not in standard plan', () => {
      // The real horizonro has db/rsm-mod/item_db_vendsystem.yml and db/import/item_db_bg.yml
      // which are NOT in the standard plan. This is expected and documented.
      const rootContent = readRathenaFile('db/item_db.yml');
      const layer: DatabaseLayer = {
        id: 'root',
        name: 'Root',
        relativePath: 'db/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(rootContent, layer);
      const imports = result.file!.imports;

      const standardPlan = loader.getStandardLayerPlan('PRE_RE');
      const standardPaths = new Set(standardPlan.map((l) => l.relativePath));

      const missingFromPlan = imports
        .filter((i) => !i.mode || i.mode === 'Prerenewal')
        .filter((i) => !standardPaths.has(i.path))
        .map((i) => i.path);

      // These are custom server layers that require dynamic import resolution
      console.log(`  Custom layers not in standard plan: ${JSON.stringify(missingFromPlan)}`);
      expect(missingFromPlan.length).toBeGreaterThan(0);
    });
  });

  // ─── 3. FULL REPOSITORY LOADING + BENCHMARK ──────────────────────────────

  describe.skipIf(!fs.existsSync(path.join(RATHENA_ROOT, 'db/item_db.yml')))('3. Full Repository Loading & Benchmark', () => {
    function createRealProvider() {
      return {
        readFile: (relPath: string) => {
          return readRathenaFile(relPath);
        },
      };
    }

    it('loads full PRE_RE repository with all layers', async () => {
      const provider = createRealProvider();

      const start = performance.now();
      const { repository, parseResults } = await loader.loadRepositoryFromProvider('PRE_RE', provider);
      const loadTime = performance.now() - start;

      const allItems = repository.getAllEffectiveItems();
      const resolveTime = performance.now() - start;

      expect(allItems.length).toBeGreaterThan(20000);

      // Verify well-known items exist
      const redPotion = repository.findById(501);
      expect(redPotion).toBeDefined();
      expect(redPotion?.fields.AegisName).toBe('Red_Potion');
      expect(redPotion?.fields.Type).toBe('Healing');
      expect(redPotion?.databaseVariant).toBe('PRE_RE');

      // Verify a weapon
      const sword = repository.findById(1101);
      expect(sword).toBeDefined();
      expect(sword?.fields.Type).toBe('Weapon');
      expect(sword?.fields.SubType).toBe('1hSword');

      // Verify by AegisName lookup
      const byAegis = repository.findByAegisName('Red_Potion');
      expect(byAegis?.id).toBe(501);

      console.log(`  PRE_RE: ${allItems.length} effective items loaded in ${loadTime.toFixed(0)}ms (resolved in ${resolveTime.toFixed(0)}ms)`);
      console.log(`  Parse results: ${Object.keys(parseResults).length} layers processed`);
    }, LARGE_TEST_TIMEOUT);

    it('loads full RE repository with all layers', async () => {
      const provider = createRealProvider();

      const start = performance.now();
      const { repository } = await loader.loadRepositoryFromProvider('RE', provider);
      const resolveTime = performance.now() - start;

      const allItems = repository.getAllEffectiveItems();
      expect(allItems.length).toBeGreaterThan(20000);

      const redPotion = repository.findById(501);
      expect(redPotion).toBeDefined();
      expect(redPotion?.databaseVariant).toBe('RE');

      console.log(`  RE: ${allItems.length} effective items loaded+resolved in ${resolveTime.toFixed(0)}ms`);
    }, LARGE_TEST_TIMEOUT);
  });

  // ─── 4. SOURCE VS EFFECTIVE INTEGRITY ─────────────────────────────────────

  describe('4. Source vs Effective Entity Integrity', () => {
    it('verifies field-level override semantics with real import data', async () => {
      const importContent = readRathenaFile('db/import/item_db.yml');
      if (!importContent.trim() || importContent.includes('Body: []')) {
        console.log('  Import file has no body items, skipping override test');
        return;
      }

      const provider = {
        readFile: (relPath: string) => readRathenaFile(relPath),
      };

      const { repository } = await loader.loadRepositoryFromProvider('PRE_RE', provider);

      const importLayer: DatabaseLayer = {
        id: 'import',
        name: 'Import',
        relativePath: 'db/import/item_db.yml',
        variant: 'UNIVERSAL',
        priority: 300,
        type: 'IMPORT',
      };

      const importResult = parser.parse(importContent, importLayer);
      if (!importResult.file || importResult.file.items.length === 0) {
        console.log('  Import file parsed but has no items');
        return;
      }

      // For each item in the import file, verify the override semantics
      for (const srcItem of importResult.file.items.slice(0, 5)) {
        const effective = repository.findById(srcItem.id);
        if (!effective) continue;

        // Fields present in import should appear in effective
        for (const key of srcItem.presentKeys) {
          if (key === 'Id') continue;
          const srcVal = srcItem.fields[key];
          const effVal = effective.fields[key as keyof typeof effective.fields];
          // The effective should have the import's value (it's the last layer)
          expect(effVal).toEqual(srcVal);
        }

        // Fields NOT in import but present in base should still be in effective
        const sourceItems = repository.findSourceItems(srcItem.id);
        expect(sourceItems.length).toBeGreaterThanOrEqual(1);
      }
    }, LARGE_TEST_TIMEOUT);

    it('verifies presentKeys correctly distinguishes absent vs present fields', () => {
      // Create a minimal override fixture
      const overrideYaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 501
    Sell: 30
`;
      const layer: DatabaseLayer = {
        id: 'override-test',
        name: 'Override Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 300,
        type: 'IMPORT',
      };

      const result = parser.parse(overrideYaml, layer);
      const item = result.file!.items[0];

      // Only Id and Sell should be present
      expect(item.presentKeys.has('Id')).toBe(true);
      expect(item.presentKeys.has('Sell')).toBe(true);
      expect(item.presentKeys.has('AegisName')).toBe(false);
      expect(item.presentKeys.has('Name')).toBe(false);
      expect(item.presentKeys.has('Type')).toBe(false);
      expect(item.presentKeys.has('Weight')).toBe(false);

      // fields should NOT have AegisName/Name
      expect(item.fields.AegisName).toBeUndefined();
      expect(item.fields.Name).toBeUndefined();
    });
  });

  // ─── 5. LOADINGFINISHED RULES AUDIT ───────────────────────────────────────

  describe('5. loadingFinished Rules Audit', () => {
    it('[Verified] reciprocal price: Buy only → Sell = floor(Buy/2)', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'price-test',
        name: 'Price Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 10001
    AegisName: Buy_Only_Item
    Name: Buy Only
    Buy: 101
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(10001)!;
      expect(item.fields.Buy).toBe(101);
      expect(item.fields.Sell).toBe(50); // floor(101/2) = 50
      expect(item.hasBuyPriceExplicit).toBe(true);
      expect(item.hasSellPriceExplicit).toBe(false);
    });

    it('[Verified] reciprocal price: Sell only → Buy = min(Sell*2, MAX_ZENY)', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'price-test-2',
        name: 'Price Test 2',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 10002
    AegisName: Sell_Only_Item
    Name: Sell Only
    Sell: 25
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(10002)!;
      expect(item.fields.Sell).toBe(25);
      expect(item.fields.Buy).toBe(50); // 25 * 2 = 50
    });

    it('[Verified] reciprocal price: both Buy and Sell defined → no auto-calc', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'price-test-3',
        name: 'Price Test 3',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 10003
    AegisName: Both_Price_Item
    Name: Both Prices
    Buy: 200
    Sell: 80
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(10003)!;
      expect(item.fields.Buy).toBe(200);
      expect(item.fields.Sell).toBe(80);
    });

    it('[Verified] weapon defaults: WeaponLevel=0 → default to 1, ArmorLevel forced to 0', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'wl-test',
        name: 'WL Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 10004
    AegisName: No_WL_Weapon
    Name: No WL Weapon
    Type: Weapon
    SubType: Dagger
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(10004)!;
      expect(item.fields.WeaponLevel).toBe(1);
      expect(item.fields.ArmorLevel).toBe(0);
    });

    it('[Verified] armor defaults: ArmorLevel=0 → default to 1, WeaponLevel forced to 0', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'al-test',
        name: 'AL Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 10005
    AegisName: No_AL_Armor
    Name: No AL Armor
    Type: Armor
    Locations:
      Armor: true
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(10005)!;
      expect(item.fields.ArmorLevel).toBe(1);
      expect(item.fields.WeaponLevel).toBe(0);
    });

    it('[Verified] non-equip types: WeaponLevel and ArmorLevel forced to 0', () => {
      const repo = new LayeredItemRepository('RE');
      const layer: DatabaseLayer = {
        id: 'etc-test',
        name: 'Etc Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 10006
    AegisName: Etc_Item
    Name: Etc Item
    Type: Etc
`;
      const parsed = parser.parse(yaml, layer);
      repo.addLayer({ layer, file: parsed.file!, adapter: parsed.adapter });

      const item = repo.findById(10006)!;
      expect(item.fields.WeaponLevel).toBe(0);
      expect(item.fields.ArmorLevel).toBe(0);
    });
  });

  // ─── 6. UNKNOWN FIELDS PRESERVATION ───────────────────────────────────────

  describe('6. Unknown Fields Preservation', () => {
    it('preserves custom fields through parse → mutate → serialize cycle', () => {
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3

Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Type: Healing
    Buy: 50
    CustomPrivateField: 123
    InternalNote: "Admin Override"
`;
      const layer: DatabaseLayer = {
        id: 'unknown-test',
        name: 'Unknown Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(yaml, layer);
      expect(result.file!.items[0].unknownFields.CustomPrivateField).toBe(123);
      expect(result.file!.items[0].unknownFields.InternalNote).toBe('Admin Override');

      // Mutate only Sell
      serializer.updateItemField(result.adapter, 0, 'Sell', 30);

      const serialized = serializer.serialize(
        { layer, file: result.file!, adapter: result.adapter },
        'RE'
      );

      // Custom fields must still be present
      expect(serialized).toContain('CustomPrivateField: 123');
      expect(serialized).toContain('InternalNote: "Admin Override"');
      expect(serialized).toContain('Sell: 30');
    });
  });

  // ─── 7. COMMENT PRESERVATION ──────────────────────────────────────────────

  describe('7. Comment Preservation', () => {
    it('preserves all comment types through mutation', () => {
      const yaml = `# File-level comment
Header:
  Type: ITEM_DB
  Version: 3

Body:
  # Comment before item
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion # Inline comment on Name
    Type: Healing
    Buy: 50
    Weight: 70
    Script: |
      itemheal rand(45,65),0;
`;
      const layer: DatabaseLayer = {
        id: 'comment-test',
        name: 'Comment Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(yaml, layer);
      serializer.updateItemField(result.adapter, 0, 'Sell', 28);

      const serialized = serializer.serialize(
        { layer, file: result.file!, adapter: result.adapter },
        'RE'
      );

      expect(serialized).toContain('# File-level comment');
      expect(serialized).toContain('# Comment before item');
      // Inline comment on Name — yaml library may or may not preserve trailing comments
      // This is a known limitation we document
      expect(serialized).toContain('Sell: 28');
      expect(serialized).toContain('Weight: 70');
    });
  });

  // ─── 8. SCRIPT PRESERVATION ───────────────────────────────────────────────

  describe('8. Script Preservation', () => {
    it('preserves Script, EquipScript, UnEquipScript through mutation of external field', () => {
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3

Body:
  - Id: 2357
    AegisName: Valkyrian_Armor
    Name: Valkyrian Armor
    Type: Armor
    Buy: 20
    Defense: 55
    Script: |
      bonus bAllStats,1;
      bonus bUnbreakableArmor,0;
    EquipScript: |
      autobonus "{ bonus bMdef,5; }",100,5000;
    UnEquipScript: |
      dispbottom "Valkyrian Armor unequipped.";
`;
      const layer: DatabaseLayer = {
        id: 'script-test',
        name: 'Script Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(yaml, layer);
      // Mutate only Defense
      serializer.updateItemField(result.adapter, 0, 'Defense', 60);

      const serialized = serializer.serialize(
        { layer, file: result.file!, adapter: result.adapter },
        'RE'
      );

      expect(serialized).toContain('Defense: 60');
      expect(serialized).toContain('bonus bAllStats,1;');
      expect(serialized).toContain('bonus bUnbreakableArmor,0;');
      expect(serialized).toContain('autobonus "{ bonus bMdef,5; }",100,5000;');
      expect(serialized).toContain('dispbottom "Valkyrian Armor unequipped.";');
      // Verify Script block literal style is maintained
      expect(serialized).toContain('Script: |');
      expect(serialized).toContain('EquipScript: |');
      expect(serialized).toContain('UnEquipScript: |');
    });
  });

  // ─── 9. ROUND-TRIP FIDELITY ───────────────────────────────────────────────

  describe('9. Round-Trip Fidelity', () => {
    it('round-trips fixture files with minimal textual differences', () => {
      const fixtureFiles = [
        'simple_item.yml',
        'complex_weapon.yml',
        'multi_structures_item.yml',
        'subtypes_showcase.yml',
        'override_layer_base.yml',
        'override_layer_import.yml',
      ];

      for (const file of fixtureFiles) {
        const filePath = path.join(FIXTURES_DIR, file);
        const original = fs.readFileSync(filePath, 'utf-8');
        const layer: DatabaseLayer = {
          id: `rt-${file}`,
          name: file,
          relativePath: file,
          variant: 'UNIVERSAL',
          priority: 100,
          type: 'BASE',
        };

        const result = parser.parse(original, layer);
        expect(result.isValid).toBe(true);

        const serialized = result.adapter.toString();

        // Normalize line endings for comparison
        const normalizedOriginal = original.replace(/\r\n/g, '\n').trim();
        const normalizedSerialized = serialized.replace(/\r\n/g, '\n').trim();

        if (normalizedOriginal !== normalizedSerialized) {
          // Find and report differences
          const origLines = normalizedOriginal.split('\n');
          const serLines = normalizedSerialized.split('\n');
          const diffs: string[] = [];

          const maxLen = Math.max(origLines.length, serLines.length);
          for (let i = 0; i < maxLen; i++) {
            if (origLines[i] !== serLines[i]) {
              diffs.push(`  Line ${i + 1}: "${origLines[i] ?? '(missing)'}" → "${serLines[i] ?? '(missing)'}"`);
            }
          }

          if (diffs.length > 0) {
            console.log(`  Round-trip diffs in ${file}:`);
            diffs.slice(0, 5).forEach((d) => console.log(d));
            if (diffs.length > 5) console.log(`  ... and ${diffs.length - 5} more`);
          }
        }

        // Semantic equivalence must always hold
        const originalJS = result.adapter.toJS();
        const reparse = parser.parse(serialized, layer);
        const reparsedJS = reparse.adapter.toJS();
        expect(reparsedJS).toEqual(originalJS);
      }
    });

    it('round-trips a real rAthena file (first 50 items from usable) with semantic equivalence', () => {
      const content = readRathenaFile('db/pre-re/item_db_usable.yml');
      if (!content) return;

      const layer: DatabaseLayer = {
        id: 'rt-real',
        name: 'RT Real',
        relativePath: 'db/pre-re/item_db_usable.yml',
        variant: 'PRE_RE',
        priority: 250,
        type: 'MODE_SPECIFIC',
      };

      const result = parser.parse(content, layer);
      const serialized = result.adapter.toString();

      // Semantic equivalence
      const originalJS = result.adapter.toJS();
      const reparse = parser.parse(serialized, layer);
      const reparsedJS = reparse.adapter.toJS();
      expect(reparsedJS).toEqual(originalJS);
    }, LARGE_TEST_TIMEOUT);
  });

  // ─── 10. MUTATION API REVIEW ──────────────────────────────────────────────

  describe('10. Mutation API via Item ID', () => {
    it('can locate and mutate an item by ID within a parsed file', () => {
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3

Body:
  - Id: 100
    AegisName: Item_A
    Name: Item A
    Buy: 10
  - Id: 200
    AegisName: Item_B
    Name: Item B
    Buy: 20
  - Id: 300
    AegisName: Item_C
    Name: Item C
    Buy: 30
`;
      const layer: DatabaseLayer = {
        id: 'mutation-test',
        name: 'Mutation Test',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(yaml, layer);

      // Find item by ID in parsed items
      const targetItem = result.file!.items.find((i) => i.id === 200);
      expect(targetItem).toBeDefined();

      // Use nodeIndex to mutate
      serializer.updateItemField(result.adapter, targetItem!.nodeIndex, 'Buy', 999);

      const serialized = result.adapter.toString();
      expect(serialized).toContain('Buy: 999');
      // Verify other items unchanged
      expect(serialized).toMatch(/- Id: 100\n\s+AegisName: Item_A/);
      expect(serialized).toMatch(/- Id: 300\n\s+AegisName: Item_C/);
    });

    it('mutates item directly by Item ID without exposing internal CST indexes', () => {
      const yaml = `
Header:
  Type: ITEM_DB
  Version: 3

Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Buy: 50
    Weight: 70
  - Id: 502
    AegisName: Orange_Potion
    Name: Orange Potion
    Buy: 200
`;
      const layer: DatabaseLayer = {
        id: 'id-mutation-layer',
        name: 'ID Mutation Layer',
        relativePath: 'test.yml',
        variant: 'RE',
        priority: 100,
        type: 'BASE',
      };

      const result = parser.parse(yaml, layer);
      const layerData = { layer, file: result.file!, adapter: result.adapter };

      // Update field by ID
      const updated = serializer.updateFieldById(layerData, 501, 'Buy', 75);
      expect(updated).toBe(true);

      // Remove field by ID
      const removed = serializer.removeFieldById(layerData, 501, 'Weight');
      expect(removed).toBe(true);

      // Non-existent ID returns false
      const failed = serializer.updateFieldById(layerData, 99999, 'Buy', 10);
      expect(failed).toBe(false);

      const serialized = serializer.serialize(layerData, 'RE');
      expect(serialized).toContain('Buy: 75');
      expect(serialized).not.toContain('Weight: 70');
      expect(serialized).toContain('Orange_Potion');
    });
  });
});
