import { create } from 'zustand';
import { DatabaseVariant } from '../domain/database/common/databaseVariant';
import { DatabaseMetadata, DatabaseProviderId } from '../domain/database/provider/databaseProvider';
import { DatabaseContextLoader } from '../services/database/databaseContextLoader';
import { ItemDatabaseProvider } from '../services/database/providers/itemDatabaseProvider';
import { DatabaseRegistry } from '../domain/database/workspace/databaseRegistry';
import { ItemType, WeaponSubType, AmmoSubType } from '../domain/database/item/itemTypes';

export interface ItemFilters {
  query: string;
  type?: ItemType;
  subType?: WeaponSubType | AmmoSubType | string;
}

interface DatabaseState {
  registry: DatabaseRegistry | null;
  activeVariant: DatabaseVariant;
  metadataMap: Record<DatabaseProviderId, DatabaseMetadata>;
  
  // UI State for Explorers
  selectedItemId: number | null;
  itemFilters: ItemFilters;
  
  // Actions
  initializeWorkspace: () => void;
  setVariant: (variant: DatabaseVariant) => void;
  loadDatabase: (id: DatabaseProviderId, workspacePath: string) => Promise<void>;
  refreshMetadata: () => void;
  clearWorkspace: () => void;
  
  // UI Actions
  setSelectedItemId: (id: number | null) => void;
  setItemFilters: (filters: Partial<ItemFilters>) => void;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  registry: null,
  activeVariant: 'RE',
  metadataMap: {} as Record<DatabaseProviderId, DatabaseMetadata>,
  
  selectedItemId: null,
  itemFilters: { query: '' },

  initializeWorkspace: () => {
    const registry = new DatabaseRegistry();
    const loader = new DatabaseContextLoader();
    
    // Register standard providers
    registry.register(new ItemDatabaseProvider(loader));
    
    set({ registry });
    get().refreshMetadata();
  },

  setVariant: (variant: DatabaseVariant) => {
    set({ activeVariant: variant, selectedItemId: null }); // clear selection when switching variant
  },

  loadDatabase: async (id: DatabaseProviderId, workspacePath: string) => {
    const { registry, activeVariant } = get();
    if (!registry) return;

    const provider = registry.getProvider(id);
    if (!provider) return;

    const loader = new DatabaseContextLoader();
    const context = loader.createContext({ variant: activeVariant, workspacePath });

    // Ensure we trigger 'loading' state
    const metadata = provider.getMetadata();
    const newMetadataMap = { ...get().metadataMap, [id]: { ...metadata, state: 'loading' as const } };
    set({ metadataMap: newMetadataMap });

    try {
      await provider.load(context);
    } finally {
      get().refreshMetadata();
    }
  },

  refreshMetadata: () => {
    const { registry } = get();
    if (!registry) return;
    
    const newMetadataMap = {} as Record<DatabaseProviderId, DatabaseMetadata>;
    for (const provider of registry.getAllProviders()) {
      newMetadataMap[provider.id] = provider.getMetadata();
    }
    
    set({ metadataMap: newMetadataMap });
  },

  clearWorkspace: () => {
    set({
      registry: null,
      metadataMap: {} as Record<DatabaseProviderId, DatabaseMetadata>,
      selectedItemId: null,
      itemFilters: { query: '' },
    });
  },
  
  setSelectedItemId: (id: number | null) => {
    set({ selectedItemId: id });
  },
  
  setItemFilters: (filters: Partial<ItemFilters>) => {
    set((state) => ({ itemFilters: { ...state.itemFilters, ...filters }, selectedItemId: null }));
  }
}));
