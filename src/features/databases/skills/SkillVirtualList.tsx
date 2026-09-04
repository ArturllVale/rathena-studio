import { useMemo, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { EffectiveSkill } from '@/domain/database/skill/effectiveSkill';
import { LayeredSkillRepository } from '@/services/database/skill/layeredSkillRepository';

export interface SkillFolderInfo {
  label: string;
  isImport: boolean;
  colorClass: string;
}

export function getSkillFolderInfo(skill: EffectiveSkill): SkillFolderInfo {
  const hasImport =
    skill.layerProvenance.some((l) => l.toLowerCase().includes('import')) ||
    Object.values(skill.fieldOrigins).some((o) => o.filePath.toLowerCase().includes('import'));

  if (hasImport) {
    return {
      label: 'Import',
      isImport: true,
      colorClass: 'bg-lavender/15 text-lavender border-lavender/30 font-semibold',
    };
  }

  const hasPreRe =
    skill.layerProvenance.some((l) => l.toLowerCase().includes('pre-re')) ||
    skill.databaseVariant === 'PRE_RE';

  if (hasPreRe) {
    return {
      label: 'PRE-RE',
      isImport: false,
      colorClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 font-medium',
    };
  }

  return {
    label: 'RE',
    isImport: false,
    colorClass: 'bg-pastel-blue/15 text-pastel-blue border-pastel-blue/30 font-medium',
  };
}

function useFilteredSkills(): EffectiveSkill[] {
  const { registry, skillFilters } = useDatabaseStore();
  const provider = registry?.getProvider('skill');

  const skillMeta = useDatabaseStore((s) => s.metadataMap['skill']);

  return useMemo(() => {
    if (!provider || skillMeta?.state !== 'loaded') return [];

    const repository = provider.getRepository() as LayeredSkillRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveSkills !== 'function') return [];

    let skills = [...repository.getAllEffectiveSkills()];

    if (skillFilters.query) {
      const q = skillFilters.query.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.id.toString() === q ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.fields.Description && s.fields.Description.toLowerCase().includes(q))
      );
    }

    if (skillFilters.type) {
      skills = skills.filter((s) => s.fields.Type === skillFilters.type);
    }

    if (skillFilters.targetType) {
      skills = skills.filter((s) => s.fields.TargetType === skillFilters.targetType);
    }

    if (skillFilters.element) {
      skills = skills.filter((s) => {
        if (typeof s.fields.Element === 'string') {
          return s.fields.Element.toLowerCase() === skillFilters.element!.toLowerCase();
        }
        if (Array.isArray(s.fields.Element)) {
          return s.fields.Element.some((e) => e.Element.toLowerCase() === skillFilters.element!.toLowerCase());
        }
        return false;
      });
    }

    if (skillFilters.folder === 'import') {
      skills = skills.filter((s) => getSkillFolderInfo(s).isImport);
    } else if (skillFilters.folder === 'general') {
      skills = skills.filter((s) => !getSkillFolderInfo(s).isImport);
    }

    return skills;
  }, [provider, skillMeta, skillFilters]);
}

const SkillRow = memo(
  ({
    skill,
    style,
    isSelected,
    onClick,
  }: {
    skill: EffectiveSkill;
    style: React.CSSProperties;
    isSelected: boolean;
    onClick: (id: number) => void;
  }) => {
    const folderInfo = getSkillFolderInfo(skill);

    return (
      <div
        style={style}
        className={`flex items-center px-4 cursor-pointer text-xs border-b border-border/60 hover:bg-accent/40 transition-colors ${
          isSelected ? 'bg-pastel-blue/15 border-l-2 border-l-pastel-blue text-foreground font-semibold' : 'border-l-2 border-l-transparent text-foreground'
        }`}
        onClick={() => onClick(skill.id)}
      >
        <div className="w-16 text-muted-foreground font-mono font-medium">{skill.id}</div>
        <div className="w-48 truncate font-medium text-foreground" title={skill.name}>
          {skill.name}
        </div>
        <div className="flex-1 truncate text-muted-foreground pr-3" title={skill.fields.Description || ''}>
          {skill.fields.Description || '-'}
        </div>
        <div className="w-16 text-center text-foreground font-mono font-medium">{skill.fields.MaxLevel ?? 1}</div>
        <div className="w-24 text-center text-muted-foreground truncate">{skill.fields.Type || 'None'}</div>
        <div className="w-28 text-center text-muted-foreground truncate">{skill.fields.TargetType || 'Passive'}</div>
        <div className="w-20 text-right pr-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border ${folderInfo.colorClass}`}>
            {folderInfo.label}
          </span>
        </div>
      </div>
    );
  }
);

SkillRow.displayName = 'SkillRow';

export function SkillVirtualList() {
  const skills = useFilteredSkills();
  const parentRef = useRef<HTMLDivElement>(null);
  const { selectedSkillId, setSelectedSkillId } = useDatabaseStore();

  const rowVirtualizer = useVirtualizer({
    count: skills.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Table Header */}
      <div className="flex items-center px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/80 tracking-wider uppercase">
        <div className="w-16">ID</div>
        <div className="w-48">AEGIS NAME</div>
        <div className="flex-1">DESCRIPTION</div>
        <div className="w-16 text-center">MAX LVL</div>
        <div className="w-24 text-center">TYPE</div>
        <div className="w-28 text-center">TARGET</div>
        <div className="w-20 text-right pr-2">FOLDER</div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const skill = skills[virtualRow.index];
            return (
              <SkillRow
                key={skill.id}
                skill={skill}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                isSelected={selectedSkillId === skill.id}
                onClick={setSelectedSkillId}
              />
            );
          })}
        </div>
        {skills.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No skills found matching the filters.
          </div>
        )}
      </div>
    </div>
  );
}
