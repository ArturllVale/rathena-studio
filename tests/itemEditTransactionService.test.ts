import { describe, it, expect } from 'vitest';
import { ItemEditTransactionService } from '../src/services/database/itemEditTransactionService';
import { ItemEditSession } from '../src/domain/database/workspace/itemEditSession';
import { ItemDatabaseValidator } from '../src/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '../src/services/database/itemDatabaseSerializer';
import { DatabaseContextLoader, LayerFileContentProvider } from '../src/services/database/databaseContextLoader';
import { ItemDatabaseProvider } from '../src/services/database/providers/itemDatabaseProvider';

import { DatabaseContext } from '../src/domain/database/common/databaseContext';
import { FileContentWriter } from '../src/domain/database/workspace/fileContentWriter';

class InMemoryFileProvider implements LayerFileContentProvider, FileContentWriter {
  public files = new Map<string, string>();

  async readFile(relativePath: string): Promise<string> {
    return this.files.get(relativePath) || '';
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    this.files.set(relativePath, content);
  }
}

describe('ItemEditTransactionService - Provenance Integration', () => {
  it('should override inherited field in import layer without modifying base', async () => {
    const fileProvider = new InMemoryFileProvider();
    
    // Setup Base
    fileProvider.files.set('db/item_db.yml', `
Header:
  Type: ITEM_DB
  Version: 1
Body:
  - Id: 501
    AegisName: RED_POTION
    Name: Red Potion
    Sell: 25
    Weight: 70
`);

    // Setup Import
    fileProvider.files.set('db/import/item_db.yml', `
Header:
  Type: ITEM_DB
  Version: 1
Body:
  - Id: 501
    Sell: 30
`);

    const loader = new DatabaseContextLoader();
    const provider = new ItemDatabaseProvider(loader, () => fileProvider as any);

    const context: DatabaseContext = {
      variant: 'RE',
      layers: [
        { id: 'item-db-base-root', relativePath: 'db/item_db.yml', priority: 100, type: 'BASE', variant: 'UNIVERSAL', name: 'Base' },
        { id: 'item-db-import', relativePath: 'db/import/item_db.yml', priority: 300, type: 'IMPORT', variant: 'UNIVERSAL', name: 'Import' }
      ],
      workspacePath: '/',
      loadedAt: new Date()
    };

    await provider.load(context);
    const repo = provider.getRepository()!;
    const item = repo.findById(501)!;

    // Verify initial setup
    expect(item.fields.Sell).toBe(30);
    expect(item.fields.Weight).toBe(70);
    expect(item.fieldOrigins['Sell']?.layerId).toBe('item-db-import');
    expect(item.fieldOrigins['Weight']?.layerId).toBe('item-db-base-root');

    // Create edit session: change Weight = 80
    const session = new ItemEditSession(item);
    session.setField('Weight', 80);

    const validator = new ItemDatabaseValidator();
    const serializer = new ItemDatabaseSerializer();
    const service = new ItemEditTransactionService(validator, serializer, fileProvider);

    await service.commitSession(session, provider);

    // Verify files
    const newBase = fileProvider.files.get('db/item_db.yml')!;
    const newImport = fileProvider.files.get('db/import/item_db.yml')!;

    expect(newBase).toContain('Weight: 70'); // Base remains untouched
    expect(newImport).toContain('Weight: 80'); // Import gets the override

    // Verify reloaded repository state
    const updatedItem = repo.findById(501)!;
    expect(updatedItem.fields.Weight).toBe(80);
    expect(updatedItem.fields.Sell).toBe(30);
    expect(updatedItem.fieldOrigins['Weight']?.layerId).toBe('item-db-import');
  });
});
