import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseRegistry } from '../src/domain/database/workspace/databaseRegistry';
import { ItemDatabaseProvider } from '../src/services/database/providers/itemDatabaseProvider';
import { DatabaseContextLoader } from '../src/services/database/databaseContextLoader';
import { LayerFileContentProvider } from '../src/services/database/databaseContextLoader';
import { DatabaseContext } from '../src/domain/database/common/databaseContext';

class MockFileProvider implements LayerFileContentProvider {
  async readFile(relativePath: string): Promise<string> {
    if (relativePath.includes('item_db.yml')) {
      return `
Header:
  Type: ITEM_DB
  Version: 1

Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
`;
    }
    return '';
  }
}

describe('Database Workspace Infrastructure', () => {
  let registry: DatabaseRegistry;
  let loader: DatabaseContextLoader;

  beforeEach(() => {
    registry = new DatabaseRegistry();
    loader = new DatabaseContextLoader();
  });

  it('should register and retrieve providers', () => {
    const provider = new ItemDatabaseProvider(loader, () => new MockFileProvider());
    registry.register(provider);

    expect(registry.getProvider('item')).toBeDefined();
    expect(registry.getAllProviders().length).toBe(1);
  });

  it('should lazy load item database and update state', async () => {
    const provider = new ItemDatabaseProvider(loader, () => new MockFileProvider());
    registry.register(provider);

    let meta = provider.getMetadata();
    expect(meta.state).toBe('not_loaded');
    expect(meta.entityCount).toBe(0);

    const context: DatabaseContext = {
      variant: 'RE',
      layers: loader.getStandardLayerPlan('RE'),
      workspacePath: '/mock/workspace',
      loadedAt: new Date(),
    };

    await provider.load(context);

    meta = provider.getMetadata();
    expect(meta.state).toBe('loaded');
    expect(meta.entityCount).toBe(1); // Red Potion
    expect(provider.getRepository()?.findById(501)).toBeDefined();
  });
});
