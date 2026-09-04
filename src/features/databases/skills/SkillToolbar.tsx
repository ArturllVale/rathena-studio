import { useState } from 'react';
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
import { Search, X, RefreshCw, Folder, Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateSkillModal } from './CreateSkillModal';

export function SkillToolbar() {
  const { skillFilters, setSkillFilters, activeVariant, setVariant, loadDatabase } = useDatabaseStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    <>
      <div className="flex flex-col gap-3 p-3.5 bg-card/60 backdrop-blur border-b border-border/80">
        {/* Search Line */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search skill by ID, AegisName or Description..."
              className="pl-9 h-10 bg-background border-border/80 text-sm text-foreground rounded-lg"
              value={skillFilters.query}
              onChange={handleQueryChange}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/70 rounded-lg transition-colors border border-border/60"
              title="Clear Skill Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
            title="Create New Skill (+1)"
          >
            <Plus className="w-4 h-4" />
            <span>New Skill</span>
          </button>
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
              <SelectTrigger className="h-9 text-xs font-medium border-border/80 bg-background rounded-lg">
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
          <div className="w-32">
            <Select
              value={skillFilters.type || 'all'}
              onValueChange={(val) =>
                setSkillFilters({ type: val === 'all' ? undefined : (val as SkillType) })
              }
            >
              <SelectTrigger className="h-9 text-xs font-medium border-border/80 bg-background rounded-lg">
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
              <SelectTrigger className="h-9 text-xs font-medium border-border/80 bg-background rounded-lg">
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
              <SelectTrigger className="h-9 text-xs font-medium border-border/80 bg-background rounded-lg">
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
          <div className="flex bg-secondary p-0.5 rounded-lg border border-border/60 ml-auto">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeVariant === 'RE'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setVariant('RE');
                if (activeWorkspace) loadDatabase('skill', activeWorkspace.rootPath);
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
                if (activeWorkspace) loadDatabase('skill', activeWorkspace.rootPath);
              }}
            >
              PRE-RE
            </button>
          </div>

          <button
            onClick={() => activeWorkspace && loadDatabase('skill', activeWorkspace.rootPath)}
            className="h-8 px-2.5 bg-secondary hover:bg-secondary/80 border border-border/60 text-secondary-foreground rounded-lg flex items-center justify-center transition-colors shadow-2xs"
            title="Reload Skill Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CreateSkillModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
