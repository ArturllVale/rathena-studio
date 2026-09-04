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
import { CreateRandomOptModal } from './CreateRandomOptModal';

export function RandomOptionToolbar() {
  const { randomOptFilters, setRandomOptFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRandomOptFilters({ query: e.target.value });
  };

  const clearFilters = () => {
    setRandomOptFilters({ query: '', folder: undefined });
  };

  const hasFilters = Boolean(randomOptFilters.query || randomOptFilters.folder);

  return (
    <>
      <div className="flex flex-col gap-3 p-4 bg-card border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search random options / groups by ID, Name or Script..."
              className="pl-9 h-10 bg-background border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-pastel-blue/40 rounded-lg"
              value={randomOptFilters.query}
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
            title="Create Random Option (+1)"
          >
            <Plus className="w-4 h-4" />
            <span>New Option / Group</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {/* Options / Groups Tabs */}
          <div className="flex bg-secondary p-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setRandomOptFilters({ tab: 'options' })}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                randomOptFilters.tab !== 'groups'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Options
            </button>
            <button
              type="button"
              onClick={() => setRandomOptFilters({ tab: 'groups' })}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                randomOptFilters.tab === 'groups'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Option Groups
            </button>
          </div>

          <div className="w-44">
            <Select
              value={randomOptFilters.folder || 'all'}
              onValueChange={(val) =>
                setRandomOptFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
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
                if (activeWorkspace) loadDatabase('randomopt', activeWorkspace.rootPath);
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
                if (activeWorkspace) loadDatabase('randomopt', activeWorkspace.rootPath);
              }}
            >
              PRE-RE
            </button>
          </div>

          <button
            onClick={() => activeWorkspace && loadDatabase('randomopt', activeWorkspace.rootPath)}
            className="h-8 px-2.5 bg-secondary hover:bg-secondary/80 border border-border/60 text-secondary-foreground rounded-lg flex items-center justify-center transition-colors shadow-2xs"
            title="Reload Random Option Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CreateRandomOptModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
