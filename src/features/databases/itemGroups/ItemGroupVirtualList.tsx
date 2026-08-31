import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { LayeredItemGroupRepository } from '@/services/database/itemGroup/layeredItemGroupRepository';
import { getItemGroupAllEntries } from '@/domain/database/itemGroup/itemGroupTypes';
import { Layers } from 'lucide-react';

export function ItemGroupVirtualList() {
  const { registry, selectedGroupKey, setSelectedGroupKey, itemGroupFilters } = useDatabaseStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const groupProvider = registry?.getProvider('group');
  const groups = useMemo(() => {
    if (!groupProvider) return [];
    const repository = groupProvider.getRepository() as LayeredItemGroupRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveGroups !== 'function') return [];
    return repository.getAllEffectiveGroups();
  }, [groupProvider]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const allEntries = getItemGroupAllEntries(group.fields);
      if (itemGroupFilters.query) {
        const q = itemGroupFilters.query.toLowerCase();
        const matchesKey = group.key.toLowerCase().includes(q);
        const matchesName = group.group.toLowerCase().includes(q);
        const matchesItem = allEntries.some((entry) => String(entry.Item).toLowerCase().includes(q));
        if (!matchesKey && !matchesName && !matchesItem) return false;
      }

      if (itemGroupFilters.folder) {
        const topLayer = group.layerProvenance[group.layerProvenance.length - 1];
        const isImport = topLayer.includes('import');
        if (itemGroupFilters.folder === 'import' && !isImport) return false;
        if (itemGroupFilters.folder === 'general' && isImport) return false;
      }

      return true;
    });
  }, [groups, itemGroupFilters]);

  const virtualizer = useVirtualizer({
    count: filteredGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  if (filteredGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
        <Layers className="w-8 h-8 mb-2 opacity-30" />
        <span>No item groups match current filter criteria.</span>
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
          const group = filteredGroups[virtualRow.index];
          const isSelected = group.key === selectedGroupKey;
          const isImport = group.layerProvenance[group.layerProvenance.length - 1]?.includes('import');

          return (
            <div
              key={group.key}
              onClick={() => setSelectedGroupKey(group.key)}
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
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-medium truncate text-neutral-200">
                    {group.group}
                    {group.subGroup !== undefined && (
                      <span className="text-[11px] text-neutral-400 ml-1.5 font-normal">
                        (SubGroup: {group.subGroup})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate font-mono">
                    {getItemGroupAllEntries(group.fields).length} items in group
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
