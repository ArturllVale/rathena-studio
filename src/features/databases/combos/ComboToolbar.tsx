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
import { CreateComboModal } from './CreateComboModal';

export function ComboToolbar() {
  const { comboFilters, setComboFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComboFilters({ query: e.target.value });
  };

  const clearFilters = () => {
    setComboFilters({ query: '', folder: undefined });
  };

  const hasFilters = Boolean(comboFilters.query || comboFilters.folder);

  return (
    <>
      <div className="flex flex-col gap-2 p-3 bg-[#1f1f23] border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search combo by item name or script..."
              className="pl-9 h-8 bg-[#141416] border-[#27272a] text-xs text-neutral-200"
              value={comboFilters.query}
              onChange={handleQueryChange}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] rounded"
              title="Clear Combo Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 h-8 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Combo"
          >
            <Plus className="w-4 h-4" />
            <span>New Combo</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="w-36">
            <Select
              value={comboFilters.folder || 'all'}
              onValueChange={(val) =>
                setComboFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
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
                if (activeWorkspace) loadDatabase('combo', activeWorkspace.rootPath);
              }}
            >
              RE
            </button>
            <button
              className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
              onClick={() => {
                setVariant('PRE_RE');
                if (activeWorkspace) loadDatabase('combo', activeWorkspace.rootPath);
              }}
            >
              PRE-RE
            </button>
          </div>

          <button
            onClick={() => activeWorkspace && loadDatabase('combo', activeWorkspace.rootPath)}
            className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-neutral-300 rounded flex items-center justify-center"
            title="Reload Combo Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CreateComboModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
