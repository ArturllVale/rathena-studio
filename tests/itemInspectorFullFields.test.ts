import { describe, it, expect } from 'vitest';
import { ItemEditSession } from '../src/domain/database/workspace/itemEditSession';
import { EffectiveItem, createEffectiveItem } from '../src/domain/database/item/effectiveItem';
import { ItemDatabaseSerializer } from '../src/services/database/itemDatabaseSerializer';
import { ItemDatabaseParser } from '../src/services/database/itemDatabaseParser';
import { YamlDocumentAdapter } from '../src/services/database/yamlDocumentAdapter';
import { DatabaseLayer } from '../src/domain/database/common/databaseLayer';

describe('Item Database Full Fields Support (Phase 1)', () => {
  const sampleLayer: DatabaseLayer = {
    id: 'item-db-equip-re',
    name: 'Item DB Equip RE',
    relativePath: 'db/re/item_db_equip.yml',
    variant: 'RE',
    priority: 260,
    type: 'MODE_SPECIFIC',
  };

  const initialYaml = `Header:
  Type: ITEM_DB
  Version: 3

Body:
  - Id: 1101
    AegisName: Sword
    Name: Sword
    Type: Weapon
    SubType: 1hSword
    Buy: 100
    Sell: 50
    Weight: 500
    Attack: 25
    Range: 1
    Slots: 3
    Jobs:
      Novice: true
      Swordman: true
    Classes:
      Normal: true
    Gender: Both
    Locations:
      Right_Hand: true
    WeaponLevel: 1
    EquipLevelMin: 1
    Refineable: true
`;

  it('should parse all rAthena canonical fields correctly', () => {
    const parser = new ItemDatabaseParser();
    const result = parser.parse(initialYaml, sampleLayer);

    expect(result.isValid).toBe(true);
    expect(result.file?.items).toHaveLength(1);

    const item = result.file!.items[0];
    expect(item.id).toBe(1101);
    expect(item.fields.Attack).toBe(25);
    expect(item.fields.Range).toBe(1);
    expect(item.fields.Slots).toBe(3);
    expect(item.fields.Jobs).toEqual({ Novice: true, Swordman: true });
    expect(item.fields.Classes).toEqual({ Normal: true });
    expect(item.fields.Locations).toEqual({ Right_Hand: true });
    expect(item.fields.Refineable).toBe(true);
    expect(item.fields.Gender).toBe('Both');
  });

  it('should support modifying combat stats, requirements, and flags via ItemEditSession', () => {
    const effectiveItem: EffectiveItem = createEffectiveItem({
      id: 1101,
      databaseVariant: 'RE',
      fields: {
        Id: 1101,
        AegisName: 'Sword',
        Name: 'Sword',
        Type: 'Weapon',
        SubType: '1hSword',
        Attack: 25,
        Defense: 0,
        Range: 1,
        Jobs: { All: true },
        Locations: { Right_Hand: true },
      },
      fieldOrigins: {},
      layerProvenance: ['item-db-equip-re'],
      hasBuyPriceExplicit: true,
      hasSellPriceExplicit: true,
    });

    const session = new ItemEditSession(effectiveItem);

    // Update combat stats
    session.setField('Attack', 35);
    session.setField('MagicAttack', 10);
    session.setField('Defense', 5);
    session.setField('Range', 2);
    session.setField('Refineable', true);
    session.setField('Gradable', true);

    // Update requirements
    session.setField('EquipLevelMin', 10);
    session.setField('EquipLevelMax', 99);
    session.setField('Gender', 'Male');
    session.setField('Jobs', { Swordman: true, Knight: true });
    session.setField('Classes', { Upper: true, Third: true });

    // Update sub-structures
    session.setField('Flags', { BuyingStore: true, UniqueId: true, DropEffect: 'Red_Pillar' });
    session.setField('Trade', { NoDrop: true, NoTrade: true, Override: 100 });
    session.setField('Stack', { Amount: 50, Inventory: true });
    session.setField('Delay', { Duration: 2, Status: 'Eff_Delay' });
    session.setField('NoUse', { Sitting: true, Override: 100 });

    // Update scripts
    session.setField('Script', 'bonus bStr, 5;\nbonus bAtk, 10;');
    session.setField('EquipScript', 'bonus bMaxHP, 100;');
    session.setField('UnEquipScript', 'dispbottom "Unequipped";');

    const pending = session.getPendingChanges();
    expect(pending.Attack).toBe(35);
    expect(pending.MagicAttack).toBe(10);
    expect(pending.Defense).toBe(5);
    expect(pending.Range).toBe(2);
    expect(pending.Refineable).toBe(true);
    expect(pending.Gradable).toBe(true);
    expect(pending.EquipLevelMin).toBe(10);
    expect(pending.EquipLevelMax).toBe(99);
    expect(pending.Gender).toBe('Male');
    expect(pending.Flags).toEqual({ BuyingStore: true, UniqueId: true, DropEffect: 'Red_Pillar' });
    expect(pending.Trade).toEqual({ NoDrop: true, NoTrade: true, Override: 100 });
    expect(pending.Stack).toEqual({ Amount: 50, Inventory: true });
    expect(pending.Delay).toEqual({ Duration: 2, Status: 'Eff_Delay' });
    expect(pending.NoUse).toEqual({ Sitting: true, Override: 100 });
    expect(pending.Script).toContain('bonus bStr, 5;');
    expect(pending.EquipScript).toBe('bonus bMaxHP, 100;');
    expect(pending.UnEquipScript).toBe('dispbottom "Unequipped";');

    // Test Undo / Redo for nested fields
    session.undo(); // undo UnEquipScript
    expect(session.getPendingChanges().UnEquipScript).toBeUndefined();

    session.undo(); // undo EquipScript
    expect(session.getPendingChanges().EquipScript).toBeUndefined();

    session.redo(); // redo EquipScript
    expect(session.getPendingChanges().EquipScript).toBe('bonus bMaxHP, 100;');
  });

  it('should serialize nested objects, maps, and multiline scripts into YAML correctly', () => {
    const adapter = YamlDocumentAdapter.parse(initialYaml);
    const serializer = new ItemDatabaseSerializer();

    // Update fields in AST
    serializer.updateItemField(adapter, 0, 'Attack', 50);
    serializer.updateItemField(adapter, 0, 'Flags', { BuyingStore: true, DropEffect: 'Yellow_Pillar' });
    serializer.updateItemField(adapter, 0, 'Trade', { NoDrop: true, NoSell: true });
    serializer.updateItemField(adapter, 0, 'Jobs', { Novice: true, Merchant: true });
    serializer.updateItemField(adapter, 0, 'Script', 'bonus bStr, 10;\nbonus bDex, 5;');

    const serializedYaml = adapter.toString();

    expect(serializedYaml).toContain('Attack: 50');
    expect(serializedYaml).toContain('Flags:');
    expect(serializedYaml).toContain('BuyingStore: true');
    expect(serializedYaml).toContain('DropEffect: Yellow_Pillar');
    expect(serializedYaml).toContain('Trade:');
    expect(serializedYaml).toContain('NoDrop: true');
    expect(serializedYaml).toContain('Jobs:');
    expect(serializedYaml).toContain('Merchant: true');
    expect(serializedYaml).toContain('Script:');
    expect(serializedYaml).toContain('bonus bStr, 10;');

    // Re-parse and assert round-trip fidelity
    const parser = new ItemDatabaseParser();
    const roundTrip = parser.parse(serializedYaml, sampleLayer);
    expect(roundTrip.isValid).toBe(true);

    const parsedItem = roundTrip.file!.items[0];
    expect(parsedItem.fields.Attack).toBe(50);
    expect(parsedItem.fields.Flags).toEqual({ BuyingStore: true, DropEffect: 'Yellow_Pillar' });
    expect(parsedItem.fields.Trade).toEqual({ NoDrop: true, NoSell: true });
    expect(parsedItem.fields.Jobs).toEqual({ Novice: true, Merchant: true });
    expect(parsedItem.fields.Script?.trim()).toBe('bonus bStr, 10;\nbonus bDex, 5;');
  });
});
