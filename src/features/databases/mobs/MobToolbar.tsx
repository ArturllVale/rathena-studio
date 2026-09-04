import { useState } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { MOB_ELEMENTS, MOB_RACES, MOB_SIZES, MOB_CLASSES, MobElement, MobRace, MobSize, MobClass } from '@/domain/database/mob/mobTypes';
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
import { CreateMobModal } from './CreateMobModal';

export function MobToolbar() {
  const { mobFilters, setMobFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobFilters({ query: e.target.value });
  };

  const clearFilters = () => {
    setMobFilters({
      query: '',
      element: undefined,
      race: undefined,
      size: undefined,
      class: undefined,
      folder: undefined,
    });
  };

  const hasFilters = Boolean(
    mobFilters.query ||
    mobFilters.element ||
    mobFilters.race ||
    mobFilters.size ||
    mobFilters.class ||
    mobFilters.folder
  );

  return (
    <>
      <div className="flex flex-col gap-3 p-4 bg-card border-b border-border/80">
        {/* Search Line */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search monster by ID, AegisName or Name..."
              className="pl-9 h-10 bg-background border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-pastel-blue/40 rounded-lg"
              value={mobFilters.query}
              onChange={handleQueryChange}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/70 rounded-lg transition-colors border border-border/60"
              title="Clear Monster Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Monster (+1)"
          >
            <Plus className="w-4 h-4" />
            <span>New Monster</span>
          </button>
        </div>

        {/* Filter Selects */}
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {/* Folder Filter */}
          <div className="w-40">
            <Select
              value={mobFilters.folder || 'all'}
              onValueChange={(val) =>
                setMobFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background text-foreground">
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

          {/* Element Filter */}
          <div className="w-36">
            <Select
              value={mobFilters.element || 'all'}
              onValueChange={(val) =>
                setMobFilters({ element: val === 'all' ? undefined : (val as MobElement) })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background text-foreground">
                <SelectValue placeholder="Element" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elements</SelectItem>
                {MOB_ELEMENTS.map((el) => (
                  <SelectItem key={el} value={el}>
                    {el}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Race Filter */}
          <div className="w-36">
            <Select
              value={mobFilters.race || 'all'}
              onValueChange={(val) =>
                setMobFilters({ race: val === 'all' ? undefined : (val as MobRace) })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background text-foreground">
                <SelectValue placeholder="Race" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Races</SelectItem>
                {MOB_RACES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Filter */}
          <div className="w-32">
            <Select
              value={mobFilters.class || 'all'}
              onValueChange={(val) =>
                setMobFilters({ class: val === 'all' ? undefined : (val as MobClass) })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background text-foreground">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {MOB_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Filter */}
          <div className="w-32">
            <Select
              value={mobFilters.size || 'all'}
              onValueChange={(val) =>
                setMobFilters({ size: val === 'all' ? undefined : (val as MobSize) })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background text-foreground">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {MOB_SIZES.map((sz) => (
                  <SelectItem key={sz} value={sz}>
                    {sz}
                  </SelectItem>
                ))}
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
                if (activeWorkspace) loadDatabase('mob', activeWorkspace.rootPath);
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
                if (activeWorkspace) loadDatabase('mob', activeWorkspace.rootPath);
              }}
            >
              PRE-RE
            </button>
          </div>

          <button
            onClick={() => activeWorkspace && loadDatabase('mob', activeWorkspace.rootPath)}
            className="h-8 px-2.5 bg-secondary hover:bg-secondary/80 border border-border/60 text-secondary-foreground rounded-lg flex items-center justify-center transition-colors shadow-2xs"
            title="Reload Monster Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CreateMobModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
