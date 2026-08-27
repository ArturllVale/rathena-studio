import { create } from 'zustand';
import { DatabaseVariant } from '../domain/database/common/databaseVariant';
import { DatabaseMetadata, DatabaseProviderId } from '../domain/database/provider/databaseProvider';
import { DatabaseContextLoader } from '../services/database/databaseContextLoader';
import { ItemDatabaseProvider } from '../services/database/providers/itemDatabaseProvider';
import { MobDatabaseProvider } from '../services/database/providers/mobDatabaseProvider';
import { SkillDatabaseProvider } from '../services/database/providers/skillDatabaseProvider';
import { DatabaseRegistry } from '../domain/database/workspace/databaseRegistry';
import { ItemType, WeaponSubType, AmmoSubType } from '../domain/database/item/itemTypes';
import { MobElement, MobRace, MobSize, MobClass } from '../domain/database/mob/mobTypes';
import { SkillType, SkillTargetType, SkillElement } from '../domain/database/skill/skillTypes';

export type ItemFolderFilter = 'all' | 'import' | 'general';

export interface ItemFilters {
  query: string;
  type?: ItemType;
  subType?: WeaponSubType | AmmoSubType | string;
  folder?: ItemFolderFilter;
}

export interface MobFilters {
  query: string;
  element?: MobElement;
  race?: MobRace;
  size?: MobSize;
  class?: MobClass;
  folder?: ItemFolderFilter;
}

export interface SkillFilters {
  query: string;
  type?: SkillType;
  targetType?: SkillTargetType;
  element?: SkillElement;
  folder?: ItemFolderFilter;
}

interface DatabaseState {
  registry: DatabaseRegistry | null;
  activeVariant: DatabaseVariant;
  activeDatabase: DatabaseProviderId;
  metadataMap: Record<DatabaseProviderId, DatabaseMetadata>;

  // UI State for Explorers
  selectedItemId: number | null;
  itemFilters: ItemFilters;
  selectedMobId: number | null;
  mobFilters: MobFilters;
  selectedSkillId: number | null;
  skillFilters: SkillFilters;

  // Actions
  initializeWorkspace: () => void;
  setActiveDatabase: (id: DatabaseProviderId) => void;
  setVariant: (variant: DatabaseVariant) => void;
  loadDatabase: (id: DatabaseProviderId, workspacePath: string) => Promise<void>;
  loadAllDatabases: (workspacePath: string) => Promise<void>;
  refreshMetadata: () => void;
  clearWorkspace: () => void;

  // UI Actions
  setSelectedItemId: (id: number | null) => void;
  setItemFilters: (filters: Partial<ItemFilters>) => void;
  setSelectedMobId: (id: number | null) => void;
  setMobFilters: (filters: Partial<MobFilters>) => void;
  setSelectedSkillId: (id: number | null) => void;
  setSkillFilters: (filters: Partial<SkillFilters>) => void;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  registry: null,
  activeVariant: 'RE',
  activeDatabase: 'item',
  metadataMap: {} as Record<DatabaseProviderId, DatabaseMetadata>,

  selectedItemId: null,
  itemFilters: { query: '' },
  selectedMobId: null,
  mobFilters: { query: '' },
  selectedSkillId: null,
  skillFilters: { query: '' },

  initializeWorkspace: () => {
    if (get().registry) return;

    const registry = new DatabaseRegistry();
    const loader = new DatabaseContextLoader();

    // Register standard providers
    registry.register(new ItemDatabaseProvider(loader));
    registry.register(new MobDatabaseProvider(loader));
    registry.register(new SkillDatabaseProvider(loader));

    set({ registry });
    get().refreshMetadata();
  },

  setActiveDatabase: (id: DatabaseProviderId) => {
    set({ activeDatabase: id });
  },

  setVariant: (variant: DatabaseVariant) => {
    set({
      activeVariant: variant,
      selectedItemId: null,
      selectedMobId: null,
      selectedSkillId: null,
    });
  },

  loadDatabase: async (id: DatabaseProviderId, workspacePath: string) => {
    const { registry, activeVariant } = get();
    if (!registry) return;

    const provider = registry.getProvider(id);
    if (!provider) return;

    const loader = new DatabaseContextLoader();
    const context = loader.createContext({ variant: activeVariant, workspacePath });

    const metadata = provider.getMetadata();
    const newMetadataMap = { ...get().metadataMap, [id]: { ...metadata, state: 'loading' as const } };
    set({ metadataMap: newMetadataMap });

    try {
      await provider.load(context);
    } finally {
      get().refreshMetadata();
    }
  },

  loadAllDatabases: async (workspacePath: string) => {
    const { loadDatabase, registry } = get();
    if (!registry) return;

    const providers = registry.getAllProviders();
    for (const provider of providers) {
      await loadDatabase(provider.id, workspacePath);
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
      selectedMobId: null,
      selectedSkillId: null,
      itemFilters: { query: '' },
      mobFilters: { query: '' },
      skillFilters: { query: '' },
    });
  },

  setSelectedItemId: (id: number | null) => {
    set({ selectedItemId: id });
  },

  setItemFilters: (filters: Partial<ItemFilters>) => {
    set((state) => ({ itemFilters: { ...state.itemFilters, ...filters }, selectedItemId: null }));
  },

  setSelectedMobId: (id: number | null) => {
    set({ selectedMobId: id });
  },

  setMobFilters: (filters: Partial<MobFilters>) => {
    set((state) => ({ mobFilters: { ...state.mobFilters, ...filters }, selectedMobId: null }));
  },

  setSelectedSkillId: (id: number | null) => {
    set({ selectedSkillId: id });
  },

  setSkillFilters: (filters: Partial<SkillFilters>) => {
    set((state) => ({ skillFilters: { ...state.skillFilters, ...filters }, selectedSkillId: null }));
  },
}));
