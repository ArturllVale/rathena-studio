import { create } from 'zustand';
import { DatabaseVariant } from '../domain/database/common/databaseVariant';
import { DatabaseMetadata, DatabaseProviderId } from '../domain/database/provider/databaseProvider';
import { DatabaseContextLoader } from '../services/database/databaseContextLoader';
import { ItemDatabaseProvider } from '../services/database/providers/itemDatabaseProvider';
import { MobDatabaseProvider } from '../services/database/providers/mobDatabaseProvider';
import { SkillDatabaseProvider } from '../services/database/providers/skillDatabaseProvider';
import { ComboDatabaseProvider } from '../services/database/providers/comboDatabaseProvider';
import { ItemGroupDatabaseProvider } from '../services/database/providers/itemGroupDatabaseProvider';
import { ItemPackageDatabaseProvider } from '../services/database/providers/itemPackageDatabaseProvider';
import { RandomOptDatabaseProvider } from '../services/database/providers/randomOptDatabaseProvider';
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

export interface ComboFilters {
  query: string;
  folder?: ItemFolderFilter;
}

export interface ItemGroupFilters {
  query: string;
  folder?: ItemFolderFilter;
}

export interface ItemPackageFilters {
  query: string;
  folder?: ItemFolderFilter;
}

export interface RandomOptFilters {
  query: string;
  tab?: 'options' | 'groups';
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

  selectedComboKey: string | null;
  comboFilters: ComboFilters;

  selectedGroupKey: string | null;
  itemGroupFilters: ItemGroupFilters;

  selectedPackageName: string | null;
  itemPackageFilters: ItemPackageFilters;

  selectedRandomOptId: number | null;
  selectedRandomGroupId: number | null;
  randomOptFilters: RandomOptFilters;

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

  setSelectedComboKey: (key: string | null) => void;
  setComboFilters: (filters: Partial<ComboFilters>) => void;

  setSelectedGroupKey: (key: string | null) => void;
  setItemGroupFilters: (filters: Partial<ItemGroupFilters>) => void;

  setSelectedPackageName: (name: string | null) => void;
  setItemPackageFilters: (filters: Partial<ItemPackageFilters>) => void;

  setSelectedRandomOptId: (id: number | null) => void;
  setSelectedRandomGroupId: (id: number | null) => void;
  setRandomOptFilters: (filters: Partial<RandomOptFilters>) => void;
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

  selectedComboKey: null,
  comboFilters: { query: '' },

  selectedGroupKey: null,
  itemGroupFilters: { query: '' },

  selectedPackageName: null,
  itemPackageFilters: { query: '' },

  selectedRandomOptId: null,
  selectedRandomGroupId: null,
  randomOptFilters: { query: '', tab: 'options' },

  initializeWorkspace: () => {
    if (get().registry) return;

    const registry = new DatabaseRegistry();
    const loader = new DatabaseContextLoader();

    // Register all database providers
    registry.register(new ItemDatabaseProvider(loader));
    registry.register(new MobDatabaseProvider(loader));
    registry.register(new SkillDatabaseProvider(loader));
    registry.register(new ComboDatabaseProvider(loader));
    registry.register(new ItemGroupDatabaseProvider(loader));
    registry.register(new ItemPackageDatabaseProvider(loader));
    registry.register(new RandomOptDatabaseProvider(loader));

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
      selectedComboKey: null,
      selectedGroupKey: null,
      selectedPackageName: null,
      selectedRandomOptId: null,
      selectedRandomGroupId: null,
    });
  },

  loadDatabase: async (id: DatabaseProviderId, workspacePath: string) => {
    const { registry, activeVariant } = get();
    if (!registry) return;

    const provider = registry.getProvider(id);
    if (!provider) return;

    const loader = new DatabaseContextLoader();
    let customLayers;
    if (id === 'combo') {
      customLayers = loader.getStandardComboLayerPlan(activeVariant);
    } else if (id === 'group') {
      customLayers = loader.getStandardItemGroupLayerPlan(activeVariant);
    } else if (id === 'package') {
      customLayers = loader.getStandardItemPackageLayerPlan(activeVariant);
    } else if (id === 'randomopt') {
      customLayers = loader.getStandardRandomOptLayerPlan(activeVariant);
    }

    const context = loader.createContext({ variant: activeVariant, workspacePath, customLayers: customLayers ? [...customLayers] : undefined });

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
      selectedComboKey: null,
      selectedGroupKey: null,
      selectedPackageName: null,
      selectedRandomOptId: null,
      selectedRandomGroupId: null,
      itemFilters: { query: '' },
      mobFilters: { query: '' },
      skillFilters: { query: '' },
      comboFilters: { query: '' },
      itemGroupFilters: { query: '' },
      itemPackageFilters: { query: '' },
      randomOptFilters: { query: '', tab: 'options' },
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

  setSelectedComboKey: (key: string | null) => {
    set({ selectedComboKey: key });
  },

  setComboFilters: (filters: Partial<ComboFilters>) => {
    set((state) => ({ comboFilters: { ...state.comboFilters, ...filters }, selectedComboKey: null }));
  },

  setSelectedGroupKey: (key: string | null) => {
    set({ selectedGroupKey: key });
  },

  setItemGroupFilters: (filters: Partial<ItemGroupFilters>) => {
    set((state) => ({ itemGroupFilters: { ...state.itemGroupFilters, ...filters }, selectedGroupKey: null }));
  },

  setSelectedPackageName: (name: string | null) => {
    set({ selectedPackageName: name });
  },

  setItemPackageFilters: (filters: Partial<ItemPackageFilters>) => {
    set((state) => ({ itemPackageFilters: { ...state.itemPackageFilters, ...filters }, selectedPackageName: null }));
  },

  setSelectedRandomOptId: (id: number | null) => {
    set({ selectedRandomOptId: id });
  },

  setSelectedRandomGroupId: (id: number | null) => {
    set({ selectedRandomGroupId: id });
  },

  setRandomOptFilters: (filters: Partial<RandomOptFilters>) => {
    set((state) => ({ randomOptFilters: { ...state.randomOptFilters, ...filters } }));
  },
}));
