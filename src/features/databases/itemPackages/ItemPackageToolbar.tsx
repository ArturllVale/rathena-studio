import { useState } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
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
import { CreatePackageModal } from './CreatePackageModal';

export function ItemPackageToolbar() {
  const { itemPackageFilters, setItemPackageFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemPackageFilters({ query: e.target.value });
  };

  const clearFilters = () => {
    setItemPackageFilters({ query: '', folder: undefined });
  };

  const hasFilters = Boolean(itemPackageFilters.query || itemPackageFilters.folder);

  return (
    <>
      <div className="flex flex-col gap-2 p-3 bg-[#1f1f23] border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search package by name or included items..."
              className="pl-9 h-8 bg-[#141416] border-[#27272a] text-xs text-neutral-200"
              value={itemPackageFilters.query}
              onChange={handleQueryChange}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] rounded"
              title="Clear Package Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 h-8 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Item Package"
          >
            <Plus className="w-4 h-4" />
            <span>New Package</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="w-36">
            <Select
              value={itemPackageFilters.folder || 'all'}
              onValueChange={(val) =>
                setItemPackageFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
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

          <div className="flex bg-[#141416] rounded border border-[#27272a] ml-auto">
            <button
              className={`px-3 py-1 rounded-l ${activeVariant === 'RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
              onClick={() => {
                setVariant('RE');
                if (activeWorkspace) loadDatabase('package', activeWorkspace.rootPath);
              }}
            >
              RE
            </button>
            <button
              className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
              onClick={() => {
                setVariant('PRE_RE');
                if (activeWorkspace) loadDatabase('package', activeWorkspace.rootPath);
              }}
            >
              PRE-RE
            </button>
          </div>

          <button
            onClick={() => activeWorkspace && loadDatabase('package', activeWorkspace.rootPath)}
            className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-neutral-300 rounded flex items-center justify-center"
            title="Reload Package Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CreatePackageModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
