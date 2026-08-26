import { useMemo, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';

// We need a hook to get the filtered items
function useFilteredItems(): EffectiveItem[] {
  const { registry, itemFilters } = useDatabaseStore();
  const provider = registry?.getProvider('item');
  
  // We use useMemo but we must depend on the repository instance.
  // Wait, zustand state doesn't update when provider finishes loading unless we refresh metadata or listen properly.
  // The 'metadataMap' updates when loading finishes. We can use it as a dependency trigger.
  const itemMeta = useDatabaseStore(s => s.metadataMap['item']);
  
  return useMemo(() => {
    if (!provider || itemMeta?.state !== 'loaded') return [];
    
    const repository = provider.getRepository() as any; // Type it properly if possible
    if (!repository || typeof repository.getAllEffectiveItems !== 'function') return [];
    
    let items: EffectiveItem[] = repository.getAllEffectiveItems();
    
    if (itemFilters.query) {
      const q = itemFilters.query.toLowerCase();
      items = items.filter(i => 
        i.id.toString() === q ||
        (i.fields.AegisName && i.fields.AegisName.toLowerCase().includes(q)) ||
        (i.fields.Name && i.fields.Name.toLowerCase().includes(q))
      );
    }
    
    if (itemFilters.type) {
      items = items.filter(i => i.fields.Type === itemFilters.type);
    }
    
    if (itemFilters.subType) {
      items = items.filter(i => i.fields.SubType === itemFilters.subType);
    }
    
    return items;
  }, [provider, itemMeta?.state, itemFilters]);
}

const ItemRow = memo(({ item, style, isSelected, onClick }: { item: EffectiveItem, style: React.CSSProperties, isSelected: boolean, onClick: (id: number) => void }) => {
  return (
    <div 
      style={style}
      className={`flex items-center px-3 cursor-pointer text-xs border-b border-[#27272a] hover:bg-[#27272a] ${isSelected ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : 'border-l-2 border-l-transparent'}`}
      onClick={() => onClick(item.id)}
    >
      <div className="w-16 text-neutral-400 font-mono">{item.id}</div>
      <div className="flex-1 truncate font-medium text-neutral-200" title={item.fields.AegisName}>{item.fields.AegisName}</div>
      <div className="flex-1 truncate text-neutral-400" title={item.fields.Name}>{item.fields.Name}</div>
      <div className="w-24 truncate text-neutral-500 text-right">{item.fields.Type || 'Usable'}</div>
    </div>
  );
});

export function ItemVirtualList() {
  const items = useFilteredItems();
  const parentRef = useRef<HTMLDivElement>(null);
  const { selectedItemId, setSelectedItemId } = useDatabaseStore();

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // 32px height per row
    overscan: 10,
  });

  return (
    <div className="h-full flex flex-col bg-[#141416]">
      <div className="flex items-center px-3 py-2 bg-[#1f1f23] text-[11px] font-semibold text-neutral-500 border-b border-[#27272a] uppercase tracking-wider">
        <div className="w-16">ID</div>
        <div className="flex-1">Aegis Name</div>
        <div className="flex-1">Name</div>
        <div className="w-24 text-right">Type</div>
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
            const item = items[virtualRow.index];
            return (
              <ItemRow 
                key={item.id}
                item={item}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                isSelected={selectedItemId === item.id}
                onClick={setSelectedItemId}
              />
            );
          })}
        </div>
        {items.length === 0 && (
          <div className="p-4 text-center text-xs text-neutral-500">
            No items found matching the filters.
          </div>
        )}
      </div>
    </div>
  );
}
