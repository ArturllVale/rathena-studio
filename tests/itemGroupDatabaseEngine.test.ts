import { describe, it, expect } from 'vitest';
import { ItemGroupDatabaseParser } from '@/services/database/itemGroup/itemGroupDatabaseParser';
import { LayeredItemGroupRepository } from '@/services/database/itemGroup/layeredItemGroupRepository';
import { ItemGroupEditSession } from '@/domain/database/workspace/itemGroupEditSession';
import { DatabaseLayer } from '@/domain/database/common/databaseLayer';

describe('ItemGroupDatabaseEngine & AST Round-Trip', () => {
  const sampleLayer: DatabaseLayer = {
    id: 'item-group-db-base-root',
    name: 'Item Group Base',
    relativePath: 'db/item_group_db.yml',
    variant: 'UNIVERSAL',
    priority: 100,
    type: 'BASE',
  };

  const sampleYaml = `# Item Groups and Box Database
Header:
  Type: ITEM_GROUP_DB
  Version: 1

Body:
  - Group: IG_Potion_Box
    SubGroup: 1
    List:
      - Item: Red_Potion
        Rate: 5000
        Amount: 5
      - Item: Yellow_Potion
        Rate: 3000
        Amount: 3
      - Item: White_Potion
        Rate: 2000
        Amount: 1
`;

  it('should correctly parse Item Groups and entries', () => {
    const parser = new ItemGroupDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    expect(result.isValid).toBe(true);
    expect(result.file?.groups).toHaveLength(1);

    const group = result.file?.groups[0];
    expect(group?.group).toBe('IG_Potion_Box');
    expect(group?.subGroup).toBe(1);
    expect(group?.fields.List).toHaveLength(3);
  });

  it('should support reverse lookup of items contained in groups', () => {
    const parser = new ItemGroupDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const repo = new LayeredItemGroupRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const groupsWithRedPotion = repo.findGroupsContainingItem('Red_Potion');
    expect(groupsWithRedPotion).toHaveLength(1);
    expect(groupsWithRedPotion[0].group).toBe('IG_Potion_Box');

    const groupsWithWhitePotion = repo.findGroupsContainingItem('White_Potion');
    expect(groupsWithWhitePotion).toHaveLength(1);
  });

  it('should support Undo/Redo in ItemGroupEditSession', () => {
    const parser = new ItemGroupDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const repo = new LayeredItemGroupRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const group = repo.findByKey('IG_Potion_Box#1')!;
    const session = new ItemGroupEditSession(group);

    expect(session.isDirty).toBe(false);

    session.setField('List', [{ Item: 'Blue_Potion', Rate: 10000, Amount: 10 }]);
    expect(session.isDirty).toBe(true);
    expect(session.getEffectiveFields().List?.[0]?.Item).toBe('Blue_Potion');

    session.undo();
    expect(session.isDirty).toBe(false);
    expect(session.getEffectiveFields().List?.[0]?.Item).toBe('Red_Potion');

    session.redo();
    expect(session.isDirty).toBe(true);
    expect(session.getEffectiveFields().List?.[0]?.Item).toBe('Blue_Potion');
  });

  it('should parse real rAthena SubGroups structure and resolve all items', () => {
    const subGroupsYaml = `# Real rAthena Item Group YAML
Header:
  Type: ITEM_GROUP_DB
  Version: 1

Body:
  - Group: ACCESORY
    SubGroups:
      - SubGroup: 0
        List:
          - Index: 0
            Item: Ring
            Rate: 10000
      - SubGroup: 1
        List:
          - Index: 0
            Item: Earring
            Rate: 5000
          - Index: 1
            Item: Necklace
            Rate: 5000
`;
    const parser = new ItemGroupDatabaseParser();
    const result = parser.parse(subGroupsYaml, sampleLayer);

    expect(result.isValid).toBe(true);
    expect(result.file?.groups).toHaveLength(1);

    const group = result.file?.groups[0];
    expect(group?.group).toBe('ACCESORY');
    expect(group?.fields.SubGroups).toHaveLength(2);
    expect(group?.fields.List).toHaveLength(3);

    const repo = new LayeredItemGroupRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const groupsWithNecklace = repo.findGroupsContainingItem('Necklace');
    expect(groupsWithNecklace).toHaveLength(1);
    expect(groupsWithNecklace[0].group).toBe('ACCESORY');

    const groupsWithRing = repo.findGroupsContainingItem('Ring');
    expect(groupsWithRing).toHaveLength(1);
    expect(groupsWithRing[0].group).toBe('ACCESORY');
  });
});
