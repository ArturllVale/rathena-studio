import { useDatabaseStore } from '@/stores/databaseStore';
import {
  SKILL_TYPES,
  SKILL_TARGET_TYPES,
  SKILL_ELEMENTS,
  SkillType,
  SkillTargetType,
  SkillElement,
} from '@/domain/database/skill/skillTypes';
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

export function SkillToolbar() {
  const { skillFilters, setSkillFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillFilters({ query: e.target.value });
  };

  const clearFilters = () => {
    setSkillFilters({
      query: '',
      type: undefined,
      targetType: undefined,
      element: undefined,
      folder: undefined,
    });
  };

  const hasFilters = Boolean(
    skillFilters.query ||
    skillFilters.type ||
    skillFilters.targetType ||
    skillFilters.element ||
    skillFilters.folder
  );

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1f1f23] border-b border-[#27272a]">
      {/* Search Line */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Search skill by ID, AegisName or Description..."
            className="pl-9 h-8 bg-[#141416] border-[#27272a] text-xs text-neutral-200"
            value={skillFilters.query}
            onChange={handleQueryChange}
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] rounded"
            title="Clear Skill Filters"
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
            value={skillFilters.folder || 'all'}
            onValueChange={(val) =>
              setSkillFilters({ folder: val === 'all' ? undefined : (val as 'import' | 'general') })
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
            value={skillFilters.type || 'all'}
            onValueChange={(val) =>
              setSkillFilters({ type: val === 'all' ? undefined : (val as SkillType) })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Skill Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SKILL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* TargetType Filter */}
        <div className="w-36">
          <Select
            value={skillFilters.targetType || 'all'}
            onValueChange={(val) =>
              setSkillFilters({ targetType: val === 'all' ? undefined : (val as SkillTargetType) })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Target Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              {SKILL_TARGET_TYPES.map((tt) => (
                <SelectItem key={tt} value={tt}>
                  {tt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Element Filter */}
        <div className="w-32">
          <Select
            value={skillFilters.element || 'all'}
            onValueChange={(val) =>
              setSkillFilters({ element: val === 'all' ? undefined : (val as SkillElement) })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Element" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Elements</SelectItem>
              {SKILL_ELEMENTS.map((el) => (
                <SelectItem key={el} value={el}>
                  {el}
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
              if (activeWorkspace) loadDatabase('skill', activeWorkspace.rootPath);
            }}
          >
            RE
          </button>
          <button
            className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'}`}
            onClick={() => {
              setVariant('PRE_RE');
              if (activeWorkspace) loadDatabase('skill', activeWorkspace.rootPath);
            }}
          >
            PRE-RE
          </button>
        </div>

        <button
          onClick={() => activeWorkspace && loadDatabase('skill', activeWorkspace.rootPath)}
          className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-neutral-300 rounded flex items-center justify-center"
          title="Reload Skill Database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
