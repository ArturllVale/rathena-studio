import { describe, it, expect } from 'vitest';
import { ItemPackageDatabaseParser } from '@/services/database/itemPackage/itemPackageDatabaseParser';
import { LayeredItemPackageRepository } from '@/services/database/itemPackage/layeredItemPackageRepository';
import { ItemPackageEditSession } from '@/domain/database/workspace/itemPackageEditSession';
import { DatabaseLayer } from '@/domain/database/common/databaseLayer';

describe('ItemPackageDatabaseEngine & AST Round-Trip', () => {
  const sampleLayer: DatabaseLayer = {
    id: 'item-package-db-base-root',
    name: 'Item Package Base',
    relativePath: 'db/item_packages.yml',
    variant: 'UNIVERSAL',
    priority: 100,
    type: 'BASE',
  };

  const sampleYaml = `# Item Packages Database
Header:
  Type: ITEM_PACKAGES
  Version: 1

Body:
  - Package: Starter_Box
    RandomOptions:
      Count: 1
      List:
        - Item: Knife
          Rate: 5000
        - Item: Sword
          Rate: 5000
    Groups:
      - Count: 1
        List:
          - Item: Red_Potion
            Amount: 50
            Rate: 10000
`;

  it('should correctly parse Package, RandomOptions and Groups', () => {
    const parser = new ItemPackageDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    expect(result.isValid).toBe(true);
    expect(result.file?.packages).toHaveLength(1);

    const pkg = result.file?.packages[0];
    expect(pkg?.package).toBe('Starter_Box');
    expect(pkg?.fields.RandomOptions?.Count).toBe(1);
    expect(pkg?.fields.RandomOptions?.List).toHaveLength(2);
    expect(pkg?.fields.Groups).toHaveLength(1);
    expect(pkg?.fields.Groups?.[0].List?.[0].Item).toBe('Red_Potion');
  });

  it('should index items inside packages for reverse lookup', () => {
    const parser = new ItemPackageDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const repo = new LayeredItemPackageRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const pkgsWithKnife = repo.findPackagesContainingItem('Knife');
    expect(pkgsWithKnife).toHaveLength(1);
    expect(pkgsWithKnife[0].package).toBe('Starter_Box');

    const pkgsWithRedPotion = repo.findPackagesContainingItem('Red_Potion');
    expect(pkgsWithRedPotion).toHaveLength(1);
  });

  it('should support Undo/Redo in ItemPackageEditSession', () => {
    const parser = new ItemPackageDatabaseParser();
    const result = parser.parse(sampleYaml, sampleLayer);

    const repo = new LayeredItemPackageRepository('RE');
    repo.addLayer({
      layer: sampleLayer,
      file: result.file!,
      adapter: result.adapter,
    });

    const pkg = repo.findByPackage('Starter_Box')!;
    const session = new ItemPackageEditSession(pkg);

    expect(session.isDirty).toBe(false);

    session.setField('Package', 'New_Starter_Box');
    expect(session.isDirty).toBe(true);
    expect(session.getEffectiveFields().Package).toBe('New_Starter_Box');

    session.undo();
    expect(session.isDirty).toBe(false);
    expect(session.getEffectiveFields().Package).toBe('Starter_Box');
  });
});
