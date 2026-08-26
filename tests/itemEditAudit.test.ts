import { describe, it, expect } from 'vitest';
import { ItemEditTransactionService } from '../src/services/database/itemEditTransactionService';
import { ItemEditSession } from '../src/domain/database/workspace/itemEditSession';
import { ItemDatabaseValidator } from '../src/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '../src/services/database/itemDatabaseSerializer';
import { DatabaseContextLoader, LayerFileContentProvider } from '../src/services/database/databaseContextLoader';
import { ItemDatabaseProvider } from '../src/services/database/providers/itemDatabaseProvider';
import { DatabaseContext } from '../src/domain/database/common/databaseContext';
import { FileContentWriter } from '../src/domain/database/workspace/fileContentWriter';
import { AppError } from '../src/lib/error';

class InMemoryFileProvider implements LayerFileContentProvider, FileContentWriter {
  public files = new Map<string, string>();
  public shouldFailWrite = false;

  async readFile(relativePath: string): Promise<string> {
    return this.files.get(relativePath) || '';
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    if (this.shouldFailWrite) {
      throw new Error('Simulated write failure');
    }
    this.files.set(relativePath, content);
  }
}

describe('Audit - Persistence and Reload', () => {
  const createContext = (fileProvider: InMemoryFileProvider) => {
    const loader = new DatabaseContextLoader();
    const provider = new ItemDatabaseProvider(loader, () => fileProvider as any);
    const context: DatabaseContext = {
      variant: 'RE',
      layers: [
        { id: 'item-db-base-root', relativePath: 'db/base.yml', priority: 100, type: 'BASE', variant: 'UNIVERSAL', name: 'Base' },
        { id: 'item-db-re-equip', relativePath: 'db/re/equip.yml', priority: 200, type: 'MODE_SPECIFIC', variant: 'RE', name: 'ReEquip' },
        { id: 'item-db-import', relativePath: 'db/import.yml', priority: 300, type: 'IMPORT', variant: 'UNIVERSAL', name: 'Import' },
        { id: 'item-db-custom', relativePath: 'db/custom.yml', priority: 400, type: 'CUSTOM', variant: 'UNIVERSAL', name: 'Custom' }
      ],
      workspacePath: '/',
      loadedAt: new Date()
    };
    return { provider, context };
  };

  it('1. Multi-layer Override Policy & 2. Partial Reload Integrity', async () => {
    const fileProvider = new InMemoryFileProvider();
    
    fileProvider.files.set('db/base.yml', `
Header:
  Type: ITEM_DB
  Version: 1
Body:
  - Id: 501
    AegisName: RED_POTION
    Name: Red Potion
    Buy: 50
    # Base comment
    UnknownFieldBase: true
`);
    fileProvider.files.set('db/re/equip.yml', `
Header:
  Type: ITEM_DB
  Version: 1
Body:
  - Id: 501
    Sell: 25
    Type: Usable
`);
    fileProvider.files.set('db/import.yml', `Header:\n  Type: ITEM_DB\n  Version: 1\nBody: null\n`);
    fileProvider.files.set('db/custom.yml', `Header:\n  Type: ITEM_DB\n  Version: 1\nBody: null\n`);

    const { provider, context } = createContext(fileProvider);
    await provider.load(context);
    const repo = provider.getRepository()!;
    let item = repo.findById(501)!;

    const session = new ItemEditSession(item);
    session.setField('Buy', 100);
    session.setField('Type', 'Healing');

    const service = new ItemEditTransactionService(new ItemDatabaseValidator(), new ItemDatabaseSerializer(), fileProvider);
    await service.commitSession(session, provider);

    const importYaml = fileProvider.files.get('db/import.yml')!;
    expect(importYaml).toContain('Buy: 100');
    expect(importYaml).toContain('Type: Healing');

    item = repo.findById(501)!;
    expect(item.fields.Buy).toBe(100);
  });

  it('3. Commit Failure - Write Failure Simulation', async () => {
    const fileProvider = new InMemoryFileProvider();
    fileProvider.files.set('db/base.yml', `Header:\n  Type: ITEM_DB\n  Version: 1\nBody:\n  - Id: 501\n    AegisName: RED\n    Name: Red\n`);
    fileProvider.files.set('db/import.yml', `Header:\n  Type: ITEM_DB\n  Version: 1\nBody: null\n`);

    const { provider, context } = createContext(fileProvider);
    await provider.load(context);
    const item = provider.getRepository()!.findById(501)!;

    const session = new ItemEditSession(item);
    session.setField('Name', 'Blue');
    
    fileProvider.shouldFailWrite = true;
    const service = new ItemEditTransactionService(new ItemDatabaseValidator(), new ItemDatabaseSerializer(), fileProvider);
    
    let caught = false;
    try {
      await service.commitSession(session, provider);
    } catch (e: any) {
      caught = true;
      expect(e.message).toContain('Simulated write failure');
    }

    expect(caught).toBe(true);
    expect(session.isDirty).toBe(true);
  });

  it('4. Commit Failure - Validation Failure', async () => {
    const fileProvider = new InMemoryFileProvider();
    fileProvider.files.set('db/base.yml', `Header:\n  Type: ITEM_DB\n  Version: 1\nBody:\n  - Id: 501\n    AegisName: RED\n    Name: Red\n    Sell: 10\n`);
    fileProvider.files.set('db/import.yml', `Header:\n  Type: ITEM_DB\n  Version: 1\nBody: null\n`);

    const { provider, context } = createContext(fileProvider);
    await provider.load(context);
    const item = provider.getRepository()!.findById(501)!;

    const session = new ItemEditSession(item);
    session.setField('Sell', -50); 
    
    const validator = new ItemDatabaseValidator();
    const service = new ItemEditTransactionService(validator, new ItemDatabaseSerializer(), fileProvider);
    
    let caught = false;
    try {
      await service.commitSession(session, provider);
    } catch (e: any) {
      caught = true;
      if (e instanceof AppError) {
        expect(e.code).toBe('ERR_VALIDATION');
      } else {
        expect(e.message).toContain('Validation failed');
      }
    }

    expect(caught).toBe(true);
    expect(session.isDirty).toBe(true);
  });
});
