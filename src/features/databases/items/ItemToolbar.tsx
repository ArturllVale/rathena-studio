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
      <div className="flex flex-col gap-3 p-4 bg-card border-b border-border/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search by ID, AegisName or Name..." 
              className="pl-10 h-10 text-sm"
              value={itemFilters.query}
              onChange={handleQueryChange}
            />
          </div>
          {hasFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/70 rounded-lg transition-colors border border-border/60"
              title="Clear Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Item (+1)"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {/* Folder Filter */}
          <div className="w-40">
            <Select
              value={itemFilters.folder || 'all'}
              onValueChange={(val) =>
                setItemFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
          <div className="w-36">
            <Select
              value={itemFilters.type || 'all'}
              onValueChange={(val) =>
                setItemFilters({
                  type: val === 'all' ? undefined : (val as ItemType),
                  subType: undefined,
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
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
          <div className="w-36">
            <Select
              disabled={!isSubtypeEnabled}
              value={itemFilters.subType || 'all'}
              onValueChange={(val) =>
                setItemFilters({ subType: val === 'all' ? undefined : val })
              }
            >
              <SelectTrigger className="h-9 text-xs">
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
          <div className="flex bg-secondary p-0.5 rounded-lg border border-border/60 ml-auto">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeVariant === 'RE' ? 'bg-primary text-primary-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => {
                setVariant('RE');
                if (activeWorkspace) loadDatabase('item', activeWorkspace.rootPath);
              }}
            >
              RE
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeVariant === 'PRE_RE' ? 'bg-primary text-primary-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
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
            className="h-8 px-2.5 bg-secondary hover:bg-secondary/80 border border-border/60 text-secondary-foreground rounded-lg flex items-center justify-center transition-colors shadow-2xs"
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
