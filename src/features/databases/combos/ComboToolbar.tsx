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
      <div className="flex flex-col gap-3 p-4 bg-card border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search combo by item name or script..."
              className="pl-9 h-10 bg-background border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-pastel-blue/40 rounded-lg"
              value={comboFilters.query}
              onChange={handleQueryChange}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/70 rounded-lg transition-colors border border-border/60"
              title="Clear Combo Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Combo (+1)"
          >
            <Plus className="w-4 h-4" />
            <span>New Combo</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          <div className="w-44">
            <Select
              value={comboFilters.folder || 'all'}
              onValueChange={(val) =>
                setComboFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border/80 text-foreground rounded-lg">
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

          {/* RE / PRE-RE Variant Switcher */}
          <div className="flex bg-secondary p-0.5 rounded-lg border border-border/60 ml-auto">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeVariant === 'RE'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setVariant('RE');
                if (activeWorkspace) loadDatabase('combo', activeWorkspace.rootPath);
              }}
            >
              RE
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeVariant === 'PRE_RE'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
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
            className="h-8 px-2.5 bg-secondary hover:bg-secondary/80 border border-border/60 text-secondary-foreground rounded-lg flex items-center justify-center transition-colors shadow-2xs"
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
