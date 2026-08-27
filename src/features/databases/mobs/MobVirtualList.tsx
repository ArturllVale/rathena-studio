import { useMemo, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { EffectiveMob } from '@/domain/database/mob/effectiveMob';
import { LayeredMobRepository } from '@/services/database/mob/layeredMobRepository';

export interface MobFolderInfo {
  label: string;
  isImport: boolean;
  colorClass: string;
}

export function getMobFolderInfo(mob: EffectiveMob): MobFolderInfo {
  const hasImport =
    mob.layerProvenance.some((l) => l.toLowerCase().includes('import')) ||
    Object.values(mob.fieldOrigins).some((o) => o.filePath.toLowerCase().includes('import'));

  if (hasImport) {
    return {
      label: 'Import',
      isImport: true,
      colorClass: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    };
  }

  const hasPreRe =
    mob.layerProvenance.some((l) => l.toLowerCase().includes('pre-re')) ||
    mob.databaseVariant === 'PRE_RE';

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

function useFilteredMobs(): EffectiveMob[] {
  const { registry, mobFilters } = useDatabaseStore();
  const provider = registry?.getProvider('mob');

  const mobMeta = useDatabaseStore((s) => s.metadataMap['mob']);

  return useMemo(() => {
    if (!provider || mobMeta?.state !== 'loaded') return [];

    const repository = provider.getRepository() as LayeredMobRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveMobs !== 'function') return [];

    let mobs = [...repository.getAllEffectiveMobs()];

    if (mobFilters.query) {
      const q = mobFilters.query.toLowerCase();
      mobs = mobs.filter(
        (m) =>
          m.id.toString() === q ||
          (m.fields.AegisName && m.fields.AegisName.toLowerCase().includes(q)) ||
          (m.fields.Name && m.fields.Name.toLowerCase().includes(q))
      );
    }

    if (mobFilters.element) {
      mobs = mobs.filter((m) => m.fields.Element === mobFilters.element);
    }

    if (mobFilters.race) {
      mobs = mobs.filter((m) => m.fields.Race === mobFilters.race);
    }

    if (mobFilters.size) {
      mobs = mobs.filter((m) => m.fields.Size === mobFilters.size);
    }

    if (mobFilters.class) {
      mobs = mobs.filter((m) => m.fields.Class === mobFilters.class);
    }

    if (mobFilters.folder === 'import') {
      mobs = mobs.filter((m) => getMobFolderInfo(m).isImport);
    } else if (mobFilters.folder === 'general') {
      mobs = mobs.filter((m) => !getMobFolderInfo(m).isImport);
    }

    return mobs;
  }, [provider, mobMeta?.state, mobFilters]);
}

const MobRow = memo(
  ({
    mob,
    style,
    isSelected,
    onClick,
  }: {
    mob: EffectiveMob;
    style: React.CSSProperties;
    isSelected: boolean;
    onClick: (id: number) => void;
  }) => {
    const folderInfo = getMobFolderInfo(mob);

    return (
      <div
        style={style}
        className={`flex items-center px-3 cursor-pointer text-xs border-b border-[#27272a] hover:bg-[#27272a] ${
          isSelected ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : 'border-l-2 border-l-transparent'
        }`}
        onClick={() => onClick(mob.id)}
      >
        <div className="w-14 text-neutral-400 font-mono">{mob.id}</div>
        <div className="flex-1 truncate font-medium text-neutral-200" title={mob.fields.AegisName}>
          {mob.fields.AegisName}
        </div>
        <div className="flex-1 truncate text-neutral-400" title={mob.fields.Name}>
          {mob.fields.Name}
        </div>
        <div className="w-12 text-center text-neutral-400 font-mono">{mob.fields.Level ?? '-'}</div>
        <div className="w-20 text-right text-neutral-300 font-mono pr-2">
          {mob.fields.Hp !== undefined ? mob.fields.Hp.toLocaleString() : '-'}
        </div>
        <div className="w-16 text-center text-neutral-400 truncate">{mob.fields.Element || 'Neutral'}</div>
        <div className="w-20 text-center text-neutral-400 truncate">{mob.fields.Race || 'Formless'}</div>
        <div className="w-18 text-right pr-1">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${folderInfo.colorClass}`}>
            {folderInfo.label}
          </span>
        </div>
      </div>
    );
  }
);

MobRow.displayName = 'MobRow';

export function MobVirtualList() {
  const mobs = useFilteredMobs();
  const parentRef = useRef<HTMLDivElement>(null);
  const { selectedMobId, setSelectedMobId } = useDatabaseStore();

  const rowVirtualizer = useVirtualizer({
    count: mobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  return (
    <div className="h-full flex flex-col bg-[#141416]">
      {/* Table Header */}
      <div className="flex items-center px-3 py-2 bg-[#1f1f23] text-[11px] font-semibold text-neutral-500 border-b border-[#27272a] uppercase tracking-wider">
        <div className="w-14">ID</div>
        <div className="flex-1">AEGIS NAME</div>
        <div className="flex-1">NAME</div>
        <div className="w-12 text-center">LVL</div>
        <div className="w-20 text-right pr-2">HP</div>
        <div className="w-16 text-center">ELE</div>
        <div className="w-20 text-center">RACE</div>
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
            const mob = mobs[virtualRow.index];
            return (
              <MobRow
                key={mob.id}
                mob={mob}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                isSelected={selectedMobId === mob.id}
                onClick={setSelectedMobId}
              />
            );
          })}
        </div>
        {mobs.length === 0 && (
          <div className="p-4 text-center text-xs text-neutral-500">
            No monsters found matching the filters.
          </div>
        )}
      </div>
    </div>
  );
}
