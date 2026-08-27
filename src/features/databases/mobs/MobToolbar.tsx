import { useDatabaseStore } from '@/stores/databaseStore';
import { MOB_ELEMENTS, MOB_RACES, MOB_SIZES, MOB_CLASSES, MobElement, MobRace, MobSize, MobClass } from '@/domain/database/mob/mobTypes';
import { Input } from '@/components/ui/input';
import { Search, X, RefreshCw, Folder } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function MobToolbar() {
  const { mobFilters, setMobFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();

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
    <div className="flex flex-col gap-2 p-3 bg-[#1f1f23] border-b border-[#27272a]">
      {/* Search Line */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Search monster by ID, AegisName or Name..."
            className="pl-9 h-8 bg-[#141416] border-[#27272a] text-xs text-neutral-200"
            value={mobFilters.query}
            onChange={handleQueryChange}
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] rounded"
            title="Clear Monster Filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Selects */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {/* Folder Filter */}
        <div className="w-36">
          <Select
            value={mobFilters.folder || 'all'}
            onValueChange={(val) =>
              setMobFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
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

        {/* Element Filter */}
        <div className="w-32">
          <Select
            value={mobFilters.element || 'all'}
            onValueChange={(val) =>
              setMobFilters({ element: val === 'all' ? undefined : (val as MobElement) })
            }
          >
            <SelectTrigger className="h-7 text-xs">
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
        <div className="w-32">
          <Select
            value={mobFilters.race || 'all'}
            onValueChange={(val) =>
              setMobFilters({ race: val === 'all' ? undefined : (val as MobRace) })
            }
          >
            <SelectTrigger className="h-7 text-xs">
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
            <SelectTrigger className="h-7 text-xs">
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
        <div className="w-28">
          <Select
            value={mobFilters.size || 'all'}
            onValueChange={(val) =>
              setMobFilters({ size: val === 'all' ? undefined : (val as MobSize) })
            }
          >
            <SelectTrigger className="h-7 text-xs">
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
        <div className="flex bg-[#141416] rounded border border-[#27272a] ml-auto">
          <button
            className={`px-3 py-1 rounded-l ${activeVariant === 'RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
            onClick={() => {
              setVariant('RE');
              if (activeWorkspace) loadDatabase('mob', activeWorkspace.rootPath);
            }}
          >
            RE
          </button>
          <button
            className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
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
          className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-neutral-300 rounded flex items-center justify-center"
          title="Reload Monster Database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
