import { useDatabaseStore } from '@/stores/databaseStore';
import { ITEM_TYPES, WEAPON_SUBTYPES } from '@/domain/database/item/itemTypes';
import { Input } from '@/components/ui/input';
import { Search, X, RefreshCw } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function ItemToolbar() {
  const { itemFilters, setItemFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemFilters({ query: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemFilters({ type: (e.target.value as any) || undefined, subType: undefined });
  };

  const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemFilters({ subType: e.target.value || undefined });
  };

  const clearFilters = () => {
    setItemFilters({ query: '', type: undefined, subType: undefined });
  };

  const hasFilters = itemFilters.query || itemFilters.type || itemFilters.subType;

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1f1f23] border-b border-[#27272a]">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-neutral-500" />
          <Input 
            type="text" 
            placeholder="Search by ID, AegisName or Name..." 
            className="pl-9 h-8 bg-[#141416] border-[#27272a] text-xs text-neutral-200"
            value={itemFilters.query}
            onChange={handleQueryChange}
          />
        </div>
        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="flex items-center justify-center p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] rounded"
            title="Clear Filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex gap-2 text-xs">
        <select 
          className="flex-1 bg-[#141416] border border-[#27272a] rounded px-2 py-1 text-neutral-300 outline-none focus:border-sky-500/50"
          value={itemFilters.type || ''}
          onChange={handleTypeChange}
        >
          <option value="">All Types</option>
          {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <select 
          className="flex-1 bg-[#141416] border border-[#27272a] rounded px-2 py-1 text-neutral-300 outline-none focus:border-sky-500/50"
          value={itemFilters.subType || ''}
          onChange={handleSubTypeChange}
          disabled={itemFilters.type !== 'Weapon' && itemFilters.type !== 'Ammo'}
        >
          <option value="">All SubTypes</option>
          {itemFilters.type === 'Weapon' && WEAPON_SUBTYPES.map(t => <option key={t} value={t}>{t}</option>)}
          {itemFilters.type === 'Ammo' && <option value="Arrow">Arrow</option>}
          {itemFilters.type === 'Ammo' && <option value="Bullet">Bullet</option>}
        </select>

        <div className="flex bg-[#141416] rounded border border-[#27272a] ml-auto">
          <button
            className={`px-3 py-1 rounded-l ${activeVariant === 'RE' ? 'bg-sky-500/20 text-sky-400' : 'text-neutral-500'}`}
            onClick={() => {
              setVariant('RE');
              if (activeWorkspace) loadDatabase('item', activeWorkspace.rootPath);
            }}
          >
            RE
          </button>
          <button
            className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400' : 'text-neutral-500'}`}
            onClick={() => {
              setVariant('PRE_RE');
              if (activeWorkspace) loadDatabase('item', activeWorkspace.rootPath);
            }}
          >
            PRE-RE
          </button>
        </div>
        
        <button
          onClick={() => activeWorkspace && loadDatabase('item', activeWorkspace.rootPath)}
          className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-neutral-300 rounded flex items-center justify-center"
          title="Reload Database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
