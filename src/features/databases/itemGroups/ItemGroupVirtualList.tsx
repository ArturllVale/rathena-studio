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
  const groupMeta = useDatabaseStore((s) => s.metadataMap['group']);
  const groups = useMemo(() => {
    if (!groupProvider || groupMeta?.state !== 'loaded') return [];
    const repository = groupProvider.getRepository() as LayeredItemGroupRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveGroups !== 'function') return [];
    return repository.getAllEffectiveGroups();
  }, [groupProvider, groupMeta]);

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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
        <Layers className="w-8 h-8 mb-2 opacity-30" />
        <span>No item groups match current filter criteria.</span>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto bg-background/50">
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
              className={`flex items-center justify-between px-3.5 py-2 border-b border-border/40 cursor-pointer text-xs transition-colors ${
                isSelected
                  ? 'bg-pastel-blue/15 border-l-2 border-l-pastel-blue text-foreground font-medium'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-4 h-4 text-pastel-mint shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-medium truncate text-foreground">
                    {group.group}
                    {group.subGroup !== undefined && (
                      <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                        (SubGroup: {group.subGroup})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate font-mono">
                    {getItemGroupAllEntries(group.fields).length} items in group
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                    isImport
                      ? 'bg-pastel-lavender/15 text-pastel-lavender border-pastel-lavender/30'
                      : 'bg-muted/60 text-muted-foreground border-border/70'
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
