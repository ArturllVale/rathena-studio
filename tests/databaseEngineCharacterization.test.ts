import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures/rathena/item-db');

describe('rAthena Database Engine — Characterization & Verification Tests', () => {
  it('verifies Header and Version contract in canonical database files', () => {
    const filePath = path.join(FIXTURES_DIR, 'simple_item.yml');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = YAML.parse(content);

    expect(doc.Header).toBeDefined();
    expect(doc.Header.Type).toBe('ITEM_DB');
    expect(doc.Header.Version).toBe(3);
    expect(Array.isArray(doc.Body)).toBe(true);
    expect(doc.Body.length).toBeGreaterThan(0);
  });

  it('characterizes simple item structure and literal script parsing', () => {
    const filePath = path.join(FIXTURES_DIR, 'simple_item.yml');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = YAML.parse(content);
    const redPotion = doc.Body.find((item: { Id: number }) => item.Id === 501);

    expect(redPotion).toBeDefined();
    expect(redPotion.AegisName).toBe('Red_Potion');
    expect(redPotion.Name).toBe('Red Potion');
    expect(redPotion.Type).toBe('Healing');
    expect(redPotion.Buy).toBe(50);
    expect(redPotion.Weight).toBe(70);
    expect(redPotion.Script.trim()).toBe('itemheal rand(45,65),0;');
  });

  it('characterizes complex weapon with subtypes, jobs, locations and flags', () => {
    const filePath = path.join(FIXTURES_DIR, 'complex_weapon.yml');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = YAML.parse(content);
    const taurusSword = doc.Body.find((item: { Id: number }) => item.Id === 1100);

    expect(taurusSword).toBeDefined();
    expect(taurusSword.Type).toBe('Weapon');
    expect(taurusSword.SubType).toBe('1hSword');
    expect(taurusSword.WeaponLevel).toBe(4);
    expect(taurusSword.Refineable).toBe(true);
    expect(taurusSword.Locations).toEqual({ Right_Hand: true });
    expect(taurusSword.Jobs.Swordman).toBe(true);
    expect(taurusSword.Jobs.Alchemist).toBe(true);
    expect(taurusSword.Flags.DropEffect).toBe('YELLOW_PILLAR');
    expect(taurusSword.Script).toContain('bonus bUnbreakableWeapon;');
  });

  it('characterizes multi-structures (Trade, Stack, NoUse, Delay, EquipScript)', () => {
    const filePath = path.join(FIXTURES_DIR, 'multi_structures_item.yml');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = YAML.parse(content);
    const valkArmor = doc.Body.find((item: { Id: number }) => item.Id === 2357);

    expect(valkArmor).toBeDefined();
    expect(valkArmor.Type).toBe('Armor');
    expect(valkArmor.Defense).toBe(55);
    expect(valkArmor.Classes.Upper).toBe(true);
    expect(valkArmor.Classes.Fourth).toBe(true);
    expect(valkArmor.Locations.Armor).toBe(true);
    expect(valkArmor.Trade.Override).toBe(100);
    expect(valkArmor.Trade.NoDrop).toBe(false);
    expect(valkArmor.EquipScript.trim()).toBe('autobonus "{ bonus bMdef,5; }",100,5000;');
    expect(valkArmor.UnEquipScript.trim()).toBe('dispbottom "Valkyrian Armor unequipped.";');
  });

  it('characterizes layered ID inheritance and in-place field override', () => {
    const basePath = path.join(FIXTURES_DIR, 'override_layer_base.yml');
    const importPath = path.join(FIXTURES_DIR, 'override_layer_import.yml');

    const baseDoc = YAML.parse(fs.readFileSync(basePath, 'utf-8'));
    const importDoc = YAML.parse(fs.readFileSync(importPath, 'utf-8'));

    // Simulated rAthena in-memory database resolution
    const inMemoryDb = new Map<number, Record<string, unknown>>();

    // 1. Base load
    for (const item of baseDoc.Body) {
      inMemoryDb.set(item.Id, { ...item });
    }

    expect(inMemoryDb.get(1101)?.Attack).toBe(25);
    expect(inMemoryDb.get(1101)?.Weight).toBe(500);
    expect(inMemoryDb.get(1101)?.AegisName).toBe('Sword');

    // 2. Import load (only Id 1101 with Attack: 50, Weight: 450)
    for (const overrideEntry of importDoc.Body) {
      const existing = inMemoryDb.get(overrideEntry.Id);
      expect(existing).toBeDefined();
      inMemoryDb.set(overrideEntry.Id, { ...existing, ...overrideEntry });
    }

    const resolved = inMemoryDb.get(1101);
    expect(resolved?.Attack).toBe(50); // Overridden
    expect(resolved?.Weight).toBe(450); // Overridden
    expect(resolved?.AegisName).toBe('Sword'); // Retained from base!
    expect(resolved?.Type).toBe('Weapon'); // Retained from base!
    expect(resolved?.Slots).toBe(3); // Retained from base!
  });

  it('demonstrates Textual Round-Trip with comment and formatting preservation using yaml Document', () => {
    const filePath = path.join(FIXTURES_DIR, 'simple_item.yml');
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    // Parse into full CST/AST Document
    const doc = YAML.parseDocument(rawContent);

    // Modify a single field in-place
    const bodySeq = doc.get('Body') as YAML.YAMLSeq;
    const firstItem = bodySeq.get(0) as YAML.YAMLMap;
    firstItem.set('Weight', 80);

    const serialized = doc.toString();

    // Verify comments are preserved
    expect(serialized).toContain('# Header');
    expect(serialized).toContain('# Red Potion - Standard healing consumable');
    expect(serialized).toContain('Weight: 80');
    expect(serialized).toContain('itemheal rand(45,65),0;');
  });

  it('characterizes validation of invalid entities and edge cases', () => {
    const filePath = path.join(FIXTURES_DIR, 'invalid_entries.yml');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = YAML.parse(content);

    const missingNameItem = doc.Body.find((i: { Id: number }) => i.Id === 99991);
    expect(missingNameItem.AegisName).toBeUndefined();
    expect(missingNameItem.Name).toBeUndefined();

    const badTypeItem = doc.Body.find((i: { Id: number }) => i.Id === 99992);
    expect(badTypeItem.Type).toBe('NonExistentType');

    const badSubTypeItem = doc.Body.find((i: { Id: number }) => i.Id === 99993);
    expect(badSubTypeItem.Type).toBe('Etc');
    expect(badSubTypeItem.SubType).toBe('1hSword');

    const overcappedItem = doc.Body.find((i: { Id: number }) => i.Id === 99994);
    expect(overcappedItem.Slots).toBe(10); // rAthena caps at MAX_SLOTS = 4 in C++
    expect(overcappedItem.EquipLevelMin).toBe(9999); // rAthena caps at MAX_LEVEL in C++
  });
});
