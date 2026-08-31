import { describe, it, expect } from 'vitest';
import { ItemDatabaseParser } from '@/services/database/itemDatabaseParser';
import { ComboDatabaseParser } from '@/services/database/combo/comboDatabaseParser';
import { ItemGroupDatabaseParser } from '@/services/database/itemGroup/itemGroupDatabaseParser';
import { ItemPackageDatabaseParser } from '@/services/database/itemPackage/itemPackageDatabaseParser';
import { LayeredItemRepository } from '@/services/database/layeredItemRepository';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { LayeredItemGroupRepository } from '@/services/database/itemGroup/layeredItemGroupRepository';
import { LayeredItemPackageRepository } from '@/services/database/itemPackage/layeredItemPackageRepository';
import { DatabaseLayer } from '@/domain/database/common/databaseLayer';

describe('Cross-Reference Engine Audit (Phase 7)', () => {
  const dummyLayer: DatabaseLayer = {
    id: 'base-layer',
    name: 'Base Layer',
    relativePath: 'db/test.yml',
    variant: 'UNIVERSAL',
    priority: 100,
    type: 'BASE',
  };

  const itemYaml = `Header:
  Type: ITEM_DB
  Version: 1
Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Type: Healing

  - Id: 502
    AegisName: Orange_Potion
    Name: Orange Potion
    Type: Healing
`;

  const comboYaml = `Header:
  Type: ITEM_COMBOS_DB
  Version: 1
Body:
  - Combo:
      - Red_Potion
      - Orange_Potion
    Script: |
      bonus bMaxHP, 200;
`;

  const groupYaml = `Header:
  Type: ITEM_GROUP_DB
  Version: 1
Body:
  - Group: IG_Novice_Potions
    List:
      - Item: Red_Potion
        Rate: 10000
        Amount: 5
`;

  const packageYaml = `Header:
  Type: ITEM_PACKAGES
  Version: 1
Body:
  - Package: Novice_Pack
    RandomOptions:
      Count: 1
      List:
        - Item: Red_Potion
          Rate: 10000
`;

  it('should cross-link items to combos, groups and packages bidirectionally', () => {
    // 1. Items
    const itemParser = new ItemDatabaseParser();
    const itemParseResult = itemParser.parse(itemYaml, dummyLayer);
    const itemRepo = new LayeredItemRepository('RE');
    itemRepo.addLayer({ layer: dummyLayer, file: itemParseResult.file!, adapter: itemParseResult.adapter });

    // 2. Combos
    const comboParser = new ComboDatabaseParser();
    const comboParseResult = comboParser.parse(comboYaml, dummyLayer);
    const comboRepo = new LayeredComboRepository('RE');
    comboRepo.addLayer({ layer: dummyLayer, file: comboParseResult.file!, adapter: comboParseResult.adapter });

    // 3. Groups
    const groupParser = new ItemGroupDatabaseParser();
    const groupParseResult = groupParser.parse(groupYaml, dummyLayer);
    const groupRepo = new LayeredItemGroupRepository('RE');
    groupRepo.addLayer({ layer: dummyLayer, file: groupParseResult.file!, adapter: groupParseResult.adapter });

    // 4. Packages
    const pkgParser = new ItemPackageDatabaseParser();
    const pkgParseResult = pkgParser.parse(packageYaml, dummyLayer);
    const pkgRepo = new LayeredItemPackageRepository('RE');
    pkgRepo.addLayer({ layer: dummyLayer, file: pkgParseResult.file!, adapter: pkgParseResult.adapter });

    // Verify Item Exists
    const redPotion = itemRepo.findById(501);
    expect(redPotion).toBeDefined();
    expect(redPotion?.fields.AegisName).toBe('Red_Potion');

    // Query Combos for Red_Potion
    const combos = comboRepo.findCombosForItem('Red_Potion');
    expect(combos).toHaveLength(1);
    expect(combos[0].key).toBe('Orange_Potion + Red_Potion');

    // Query Groups for Red_Potion
    const groups = groupRepo.findGroupsContainingItem('Red_Potion');
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe('IG_Novice_Potions');

    // Query Packages for Red_Potion
    const packages = pkgRepo.findPackagesContainingItem('Red_Potion');
    expect(packages).toHaveLength(1);
    expect(packages[0].package).toBe('Novice_Pack');
  });
});
