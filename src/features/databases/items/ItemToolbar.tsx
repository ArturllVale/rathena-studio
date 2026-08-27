import { useState } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { ITEM_TYPES, WEAPON_SUBTYPES, AMMO_SUBTYPES, CARD_SUBTYPES, ItemType } from '@/domain/database/item/itemTypes';
import { Input } from '@/components/ui/input';
import { Search, X, RefreshCw, Folder, Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateItemModal } from './CreateItemModal';

export function ItemToolbar() {
  const { itemFilters, setItemFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemFilters({ query: e.target.value });
  };

  const clearFilters = () => {
    setItemFilters({ query: '', type: undefined, subType: undefined, folder: undefined });
  };

  const hasFilters = Boolean(itemFilters.query || itemFilters.type || itemFilters.subType || itemFilters.folder);
  const isSubtypeEnabled = itemFilters.type === 'Weapon' || itemFilters.type === 'Ammo' || itemFilters.type === 'Card';

  return (
    <>
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
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 h-8 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Item (+1)"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Folder Filter */}
          <div className="w-36">
            <Select
              value={itemFilters.folder || 'all'}
              onValueChange={(val) =>
                setItemFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <div className="flex items-center gap-1 truncate">
                  <Folder className="w-3 h-3 text-neutral-400 shrink-0" />
                  <SelectValue placeholder="Folder" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                <SelectItem value="import">Import Folder</SelectItem>
                <SelectItem value="general">General (PRE-RE / RE)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="w-32">
            <Select
              value={itemFilters.type || 'all'}
              onValueChange={(val) =>
                setItemFilters({
                  type: val === 'all' ? undefined : (val as ItemType),
                  subType: undefined,
                })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SubType Filter */}
          <div className="w-32">
            <Select
              disabled={!isSubtypeEnabled}
              value={itemFilters.subType || 'all'}
              onValueChange={(val) =>
                setItemFilters({ subType: val === 'all' ? undefined : val })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="All SubTypes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SubTypes</SelectItem>
                {itemFilters.type === 'Weapon' &&
                  WEAPON_SUBTYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                {itemFilters.type === 'Ammo' &&
                  AMMO_SUBTYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                {itemFilters.type === 'Card' &&
                  CARD_SUBTYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* RE / PRE-RE Variant Switcher */}
          <div className="flex bg-[#141416] rounded border border-[#27272a] ml-auto">
            <button
              className={`px-3 py-1 rounded-l ${activeVariant === 'RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
              onClick={() => {
                setVariant('RE');
                if (activeWorkspace) loadDatabase('item', activeWorkspace.rootPath);
              }}
            >
              RE
            </button>
            <button
              className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
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

      <CreateItemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
