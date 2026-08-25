import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseRegistry } from '../src/services/database/databaseRegistry';
import { ItemDatabaseProvider } from '../src/services/database/providers/itemDatabaseProvider';
import { DatabaseContextLoader, LayerFileContentProvider } from '../src/services/database/databaseContextLoader';
import { useDatabaseStore } from '../src/stores/databaseStore';
import { useWorkspaceStore } from '../src/stores/workspaceStore';
import { ItemDatabaseParser } from '../src/services/database/itemDatabaseParser';

const mockYamlUsable = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 501
    AegisName: Red_Potion
    Name: Red Potion
    Type: Healing
    Buy: 50
  - Id: 502
    AegisName: Orange_Potion
    Name: Orange Potion
    Type: Healing
    Buy: 200
`;

const mockYamlEquip = `
Header:
  Type: ITEM_DB
  Version: 3
Body:
  - Id: 1101
    AegisName: Sword
    Name: Sword
    Type: Weapon
    SubType: 1hSword
    Buy: 100
`;

const createMockContentProvider = (): LayerFileContentProvider => {
  return {
    readFile: (relativePath: string) => {
      if (relativePath.includes('usable')) return mockYamlUsable;
      if (relativePath.includes('equip')) return mockYamlEquip;
      return `
Header:
  Type: ITEM_DB
  Version: 3
Body: []
`;
    },
  };
};

describe('Database Workspace Infrastructure — Fase 2', () => {
  let registry: DatabaseRegistry;
  let loader: DatabaseContextLoader;
  let provider: ItemDatabaseProvider;

  beforeEach(() => {
    loader = new DatabaseContextLoader(new ItemDatabaseParser());
    provider = new ItemDatabaseProvider(loader);
    registry = new DatabaseRegistry();
    registry.registerProvider(provider);
    useDatabaseStore.setState({
      registry,
      loader,
      context: loader.createContext({ variant: 'RE' }),
      metadatas: { items: provider.getMetadata() },
    });
  });

  describe('1. DatabaseRegistry', () => {
    it('registers and discovers ItemDatabaseProvider', () => {
      expect(registry.hasProvider('items')).toBe(true);
      expect(registry.getProvider('items')).toBe(provider);
      expect(registry.getAllProviders().length).toBe(1);
    });

    it('unregisters provider cleanly and unloads it', async () => {
      const mockContent = createMockContentProvider();
      const context = loader.createContext({ variant: 'RE' });
      await provider.load(context, mockContent);

      expect(provider.getMetadata().status).toBe('loaded');
      const removed = registry.unregisterProvider('items');
      expect(removed).toBe(true);
      expect(registry.hasProvider('items')).toBe(false);
      expect(provider.getMetadata().status).toBe('unloaded');
    });
  });

  describe('2. DatabaseProvider & ItemDatabaseProvider Domain Contract', () => {
    it('reports metadata accurately before and after explicit loading', async () => {
      const metaInitial = provider.getMetadata();
      expect(metaInitial.id).toBe('items');
      expect(metaInitial.name).toBe('Item Database');
      expect(metaInitial.status).toBe('unloaded');
      expect(metaInitial.entityCount).toBe(0);
      expect(metaInitial.files.length).toBe(0);
      expect(metaInitial.isDirty).toBe(false);

      const context = loader.createContext({ variant: 'RE' });
      const mockContent = createMockContentProvider();
      await provider.load(context, mockContent);

      const metaLoaded = provider.getMetadata();
      expect(metaLoaded.status).toBe('loaded');
      expect(metaLoaded.entityCount).toBe(3); // 2 from usable + 1 from equip
      expect(metaLoaded.files.length).toBeGreaterThan(0);
      expect(metaLoaded.lastLoadedAt).toBeInstanceOf(Date);
    });

    it('returns repository when loaded and null when unloaded', async () => {
      expect(provider.getRepository()).toBeNull();

      const context = loader.createContext({ variant: 'RE' });
      await provider.load(context, createMockContentProvider());

      const repo = provider.getRepository();
      expect(repo).not.toBeNull();
      expect(repo?.findById(501)).toBeDefined();

      provider.unload();
      expect(provider.getRepository()).toBeNull();
      expect(provider.getMetadata().status).toBe('unloaded');
    });
  });

  describe('3. Lazy Loading & Workspace Integration', () => {
    it('initializes workspace context without auto-loading database entities', async () => {
      // Set active workspace path
      await useWorkspaceStore.getState().setWorkspaceFromPath('/mock/rathena/root');

      const dbState = useDatabaseStore.getState();
      expect(dbState.context.workspacePath).toBe('/mock/rathena/root');
      expect(dbState.metadatas['items'].status).toBe('unloaded');
      expect(dbState.metadatas['items'].entityCount).toBe(0);
      expect(dbState.getRepository('items')).toBeNull();
    });

    it('loads database explicitly on demand', async () => {
      const mockContent = createMockContentProvider();
      const store = useDatabaseStore.getState();

      await store.loadDatabase('items', mockContent);

      const updatedMeta = useDatabaseStore.getState().metadatas['items'];
      expect(updatedMeta.status).toBe('loaded');
      expect(updatedMeta.entityCount).toBe(3);

      const repo = useDatabaseStore.getState().getRepository('items');
      expect(repo).not.toBeNull();
    });
  });

  describe('4. Variant Selection & State Transitions', () => {
    it('switches variant between RE and PRE_RE and updates context', async () => {
      const mockContent = createMockContentProvider();
      const store = useDatabaseStore.getState();

      await store.loadDatabase('items', mockContent);
      expect(useDatabaseStore.getState().context.variant).toBe('RE');

      // Change variant to PRE_RE
      await useDatabaseStore.getState().setVariant('PRE_RE', mockContent);

      expect(useDatabaseStore.getState().context.variant).toBe('PRE_RE');
      expect(useDatabaseStore.getState().metadatas['items'].variant).toBe('PRE_RE');
      expect(useDatabaseStore.getState().metadatas['items'].status).toBe('loaded');
    });

    it('handles loading errors gracefully', async () => {
      const failingContentProvider: LayerFileContentProvider = {
        readFile: () => {
          throw new Error('Disk read error simulated');
        },
      };

      const customLoader: DatabaseContextLoader = {
        createContext: (config: Parameters<typeof loader.createContext>[0]) => loader.createContext(config),
        getStandardLayerPlan: (variant: Parameters<typeof loader.getStandardLayerPlan>[0]) => loader.getStandardLayerPlan(variant),
        loadRepositoryFromProvider: async () => {
          throw new Error('Failed to load item repository');
        },
      } as unknown as DatabaseContextLoader;

      const failingProvider = new ItemDatabaseProvider(customLoader);
      const testRegistry = new DatabaseRegistry();
      testRegistry.registerProvider(failingProvider);

      useDatabaseStore.setState({
        registry: testRegistry,
        loader: customLoader,
        context: loader.createContext({ variant: 'RE' }),
        metadatas: { items: failingProvider.getMetadata() },
      });

      await expect(
        useDatabaseStore.getState().loadDatabase('items', failingContentProvider)
      ).resolves.toBeUndefined();

      const meta = useDatabaseStore.getState().metadatas['items'];
      expect(meta.status).toBe('error');
      expect(meta.error).toContain('Failed to load item repository');
    });
  });

  describe('5. Performance & Zustand Non-Duplication', () => {
    it('ensures Zustand metadatas map does NOT contain repository or entity objects', async () => {
      const mockContent = createMockContentProvider();
      await useDatabaseStore.getState().loadDatabase('items', mockContent);

      const meta = useDatabaseStore.getState().metadatas['items'];

      // Verify metadata is plain JSON-serializable object without entity dictionaries or repositories
      expect(meta).not.toHaveProperty('repository');
      expect(meta).not.toHaveProperty('items');
      expect(meta).not.toHaveProperty('entities');

      // Verify keys of metadata object
      const keys = Object.keys(meta);
      expect(keys).toEqual([
        'id',
        'name',
        'variant',
        'entityCount',
        'files',
        'lastLoadedAt',
        'status',
        'error',
        'isDirty',
      ]);
    });
  });
});
