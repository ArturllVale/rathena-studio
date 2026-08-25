import { create } from 'zustand';
import { DatabaseMetadata } from '@/domain/database/common/databaseState';
import { DatabaseVariant } from '@/domain/database/common/databaseVariant';
import { DatabaseContext } from '@/domain/database/common/databaseContext';
import { DatabaseRegistry } from '@/services/database/databaseRegistry';
import { ItemDatabaseProvider } from '@/services/database/providers/itemDatabaseProvider';
import { DatabaseContextLoader, LayerFileContentProvider } from '@/services/database/databaseContextLoader';

interface DatabaseStoreState {
  registry: DatabaseRegistry;
  loader: DatabaseContextLoader;
  context: DatabaseContext;
  metadatas: Record<string, DatabaseMetadata>;

  // Actions
  initializeWorkspaceContext: (workspacePath?: string, variant?: DatabaseVariant) => void;
  setVariant: (variant: DatabaseVariant, contentProvider?: LayerFileContentProvider) => Promise<void>;
  loadDatabase: (id: string, contentProvider?: LayerFileContentProvider) => Promise<void>;
  unloadDatabase: (id: string) => void;
  getRepository: <T = unknown>(id: string) => T | null;
}

const defaultLoader = new DatabaseContextLoader();
const createInitialRegistry = () => {
  const reg = new DatabaseRegistry();
  reg.registerProvider(new ItemDatabaseProvider(defaultLoader));
  return reg;
};

export const useDatabaseStore = create<DatabaseStoreState>((set, get) => {
  const initialRegistry = createInitialRegistry();
  const initialMetadatas: Record<string, DatabaseMetadata> = {};
  for (const p of initialRegistry.getAllProviders()) {
    initialMetadatas[p.id] = p.getMetadata();
  }

  return {
    registry: initialRegistry,
    loader: defaultLoader,
    context: defaultLoader.createContext({ variant: 'RE' }),
    metadatas: initialMetadatas,

    initializeWorkspaceContext: (workspacePath?: string, variant: DatabaseVariant = 'RE') => {
      const { loader, registry } = get();
      const newContext = loader.createContext({ variant, workspacePath });

      // Update metadata list without auto-loading database content (Lazy loading)
      const updatedMetadatas: Record<string, DatabaseMetadata> = {};
      for (const p of registry.getAllProviders()) {
        updatedMetadatas[p.id] = p.getMetadata();
      }

      set({
        context: newContext,
        metadatas: updatedMetadatas,
      });
    },

    setVariant: async (variant: DatabaseVariant, contentProvider?: LayerFileContentProvider) => {
      const { loader, context, registry, loadDatabase } = get();
      if (context.variant === variant) return;

      const newContext = loader.createContext({
        variant,
        workspacePath: context.workspacePath,
      });

      set({ context: newContext });

      // Reload any databases that were previously loaded with the new variant context
      for (const provider of registry.getAllProviders()) {
        const meta = provider.getMetadata();
        if (meta.status === 'loaded' || meta.status === 'loading') {
          await loadDatabase(provider.id, contentProvider);
        } else {
          // Unload/reset provider to reflect new variant in metadata
          provider.unload();
          set((state) => ({
            metadatas: {
              ...state.metadatas,
              [provider.id]: provider.getMetadata(),
            },
          }));
        }
      }
    },

    loadDatabase: async (id: string, contentProvider?: LayerFileContentProvider) => {
      const { registry, context } = get();
      const provider = registry.getProvider(id);
      if (!provider) return;

      // Update metadata immediately to loading
      set((state) => ({
        metadatas: {
          ...state.metadatas,
          [id]: {
            ...provider.getMetadata(),
            status: 'loading',
            variant: context.variant,
          },
        },
      }));

      try {
        if (provider.id === 'items' && contentProvider) {
          await (provider as ItemDatabaseProvider).load(context, contentProvider);
        } else {
          await provider.load(context);
        }
        set((state) => ({
          metadatas: {
            ...state.metadatas,
            [id]: provider.getMetadata(),
          },
        }));
      } catch (err) {
        set((state) => ({
          metadatas: {
            ...state.metadatas,
            [id]: provider.getMetadata(),
          },
        }));
      }
    },

    unloadDatabase: (id: string) => {
      const { registry } = get();
      const provider = registry.getProvider(id);
      if (provider) {
        provider.unload();
        set((state) => ({
          metadatas: {
            ...state.metadatas,
            [id]: provider.getMetadata(),
          },
        }));
      }
    },

    getRepository: <T = unknown>(id: string): T | null => {
      const provider = get().registry.getProvider<T>(id);
      return provider ? provider.getRepository() : null;
    },
  };
});
