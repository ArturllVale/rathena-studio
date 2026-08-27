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
      colorClass: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    };
  }

  const hasPreRe =
    skill.layerProvenance.some((l) => l.toLowerCase().includes('pre-re')) ||
    skill.databaseVariant === 'PRE_RE';

  if (hasPreRe) {
    return {
      label: 'PRE-RE',
      isImport: false,
      colorClass: 'bg-amber-950/40 text-amber-300 border-amber-500/20',
    };
  }

  return {
    label: 'RE',
    isImport: false,
    colorClass: 'bg-sky-950/40 text-sky-300 border-sky-500/20',
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
  }, [provider, skillMeta?.state, skillFilters]);
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
        className={`flex items-center px-3 cursor-pointer text-xs border-b border-[#27272a] hover:bg-[#27272a] ${
          isSelected ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : 'border-l-2 border-l-transparent'
        }`}
        onClick={() => onClick(skill.id)}
      >
        <div className="w-14 text-neutral-400 font-mono">{skill.id}</div>
        <div className="w-44 truncate font-medium text-neutral-200" title={skill.name}>
          {skill.name}
        </div>
        <div className="flex-1 truncate text-neutral-400 pr-2" title={skill.fields.Description || ''}>
          {skill.fields.Description || '-'}
        </div>
        <div className="w-14 text-center text-neutral-300 font-mono">{skill.fields.MaxLevel ?? 1}</div>
        <div className="w-20 text-center text-neutral-400 truncate">{skill.fields.Type || 'None'}</div>
        <div className="w-24 text-center text-neutral-400 truncate">{skill.fields.TargetType || 'Passive'}</div>
        <div className="w-18 text-right pr-1">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${folderInfo.colorClass}`}>
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
    estimateSize: () => 32,
    overscan: 10,
  });

  return (
    <div className="h-full flex flex-col bg-[#141416]">
      {/* Table Header */}
      <div className="flex items-center px-3 py-2 bg-[#1f1f23] text-[11px] font-semibold text-neutral-500 border-b border-[#27272a] uppercase tracking-wider">
        <div className="w-14">ID</div>
        <div className="w-44">AEGIS NAME</div>
        <div className="flex-1">DESCRIPTION</div>
        <div className="w-14 text-center">MAX LVL</div>
        <div className="w-20 text-center">TYPE</div>
        <div className="w-24 text-center">TARGET</div>
        <div className="w-18 text-right pr-2">FOLDER</div>
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
          <div className="p-4 text-center text-xs text-neutral-500">
            No skills found matching the filters.
          </div>
        )}
      </div>
    </div>
  );
}
