import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { LayeredRandomOptRepository } from '@/services/database/randomOpt/layeredRandomOptRepository';
import { Dices } from 'lucide-react';

export function RandomOptionVirtualList() {
  const {
    registry,
    selectedRandomOptId,
    selectedRandomGroupId,
    setSelectedRandomOptId,
    setSelectedRandomGroupId,
    randomOptFilters,
  } = useDatabaseStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const isGroupTab = randomOptFilters.tab === 'groups';

  const randomOptProvider = registry?.getProvider('randomopt');
  const repo = useMemo(() => {
    if (!randomOptProvider) return undefined;
    return randomOptProvider.getRepository() as LayeredRandomOptRepository | undefined;
  }, [randomOptProvider]);

  const options = useMemo(() => {
    if (!repo || typeof repo.getAllEffectiveOptions !== 'function') return [];
    return repo.getAllEffectiveOptions();
  }, [repo]);

  const groups = useMemo(() => {
    if (!repo || typeof repo.getAllEffectiveGroups !== 'function') return [];
    return repo.getAllEffectiveGroups();
  }, [repo]);

  const filteredItems = useMemo(() => {
    const q = (randomOptFilters.query || '').toLowerCase();

    if (isGroupTab) {
      return groups.filter((grp) => {
        if (q) {
          const matchesId = String(grp.id).includes(q);
          const matchesName = grp.group.toLowerCase().includes(q);
          const matchesOpt = grp.fields.Slots.some((s) => s.Options.some((o) => o.Option.toLowerCase().includes(q)));
          if (!matchesId && !matchesName && !matchesOpt) return false;
        }

        if (randomOptFilters.folder) {
          const topLayer = grp.layerProvenance[grp.layerProvenance.length - 1];
          const isImport = topLayer.includes('import');
          if (randomOptFilters.folder === 'import' && !isImport) return false;
          if (randomOptFilters.folder === 'general' && isImport) return false;
        }

        return true;
      });
    } else {
      return options.filter((opt) => {
        if (q) {
          const matchesId = String(opt.id).includes(q);
          const matchesName = opt.option.toLowerCase().includes(q);
          const matchesScript = opt.fields.Script?.toLowerCase().includes(q);
          if (!matchesId && !matchesName && !matchesScript) return false;
        }

        if (randomOptFilters.folder) {
          const topLayer = opt.layerProvenance[opt.layerProvenance.length - 1];
          const isImport = topLayer.includes('import');
          if (randomOptFilters.folder === 'import' && !isImport) return false;
          if (randomOptFilters.folder === 'general' && isImport) return false;
        }

        return true;
      });
    }
  }, [isGroupTab, groups, options, randomOptFilters]);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
        <Dices className="w-8 h-8 mb-2 opacity-30" />
        <span>No {isGroupTab ? 'option groups' : 'random options'} match current filter criteria.</span>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto bg-[#141416]">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = filteredItems[virtualRow.index];
          const isSelected = isGroupTab
            ? ('group' in item && item.id === selectedRandomGroupId)
            : ('option' in item && item.id === selectedRandomOptId);
          const isImport = item.layerProvenance[item.layerProvenance.length - 1]?.includes('import');

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isGroupTab) {
                  setSelectedRandomGroupId(item.id);
                } else {
                  setSelectedRandomOptId(item.id);
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`flex items-center justify-between px-3 py-2 border-b border-[#27272a]/60 cursor-pointer text-xs transition-colors ${
                isSelected
                  ? 'bg-sky-950/40 border-l-2 border-l-sky-500 text-neutral-100'
                  : 'hover:bg-[#1f1f23]/60 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[11px] text-neutral-500 w-9 text-right shrink-0">
                  #{item.id}
                </span>
                <div className="min-w-0">
                  <div className="font-mono font-medium truncate text-neutral-200">
                    {'group' in item ? item.group : item.option}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate font-mono">
                    {'group' in item
                      ? `${item.fields.Slots?.length || 0} Slots configured`
                      : item.fields.Script?.replace(/\n/g, ' ') || 'No script'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    isImport
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                      : 'bg-[#1f1f23] text-neutral-400 border-[#27272a]'
                  }`}
                >
                  {isImport ? 'IMPORT' : 'BASE'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
