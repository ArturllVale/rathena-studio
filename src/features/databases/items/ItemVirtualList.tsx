import { useMemo, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { LayeredItemRepository } from '@/services/database/layeredItemRepository';

export interface ItemFolderInfo {
  label: string;
  isImport: boolean;
  colorClass: string;
}

export function getItemFolderInfo(item: EffectiveItem): ItemFolderInfo {
  const hasImport =
    item.layerProvenance.some((l) => l.toLowerCase().includes('import')) ||
    Object.values(item.fieldOrigins).some((o) => o.filePath.toLowerCase().includes('import'));

  if (hasImport) {
    return {
      label: 'Import',
      isImport: true,
      colorClass: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    };
  }

  const hasPreRe =
    item.layerProvenance.some((l) => l.toLowerCase().includes('pre-re')) ||
    item.databaseVariant === 'PRE_RE';

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

// We need a hook to get the filtered items
function useFilteredItems(): EffectiveItem[] {
  const { registry, itemFilters } = useDatabaseStore();
  const provider = registry?.getProvider('item');
  
  const itemMeta = useDatabaseStore((s) => s.metadataMap['item']);
  
  return useMemo(() => {
    if (!provider || itemMeta?.state !== 'loaded') return [];
    
    const repository = provider.getRepository() as LayeredItemRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveItems !== 'function') return [];
    
    let items = [...repository.getAllEffectiveItems()];
    
    if (itemFilters.query) {
      const q = itemFilters.query.toLowerCase();
      items = items.filter((i) => 
        i.id.toString() === q ||
        (i.fields.AegisName && i.fields.AegisName.toLowerCase().includes(q)) ||
        (i.fields.Name && i.fields.Name.toLowerCase().includes(q))
      );
    }
    
    if (itemFilters.type) {
      items = items.filter((i) => i.fields.Type === itemFilters.type);
    }
    
    if (itemFilters.subType) {
      items = items.filter((i) => i.fields.SubType === itemFilters.subType);
    }

    if (itemFilters.folder === 'import') {
      items = items.filter((i) => getItemFolderInfo(i).isImport);
    } else if (itemFilters.folder === 'general') {
      items = items.filter((i) => !getItemFolderInfo(i).isImport);
    }
    
    return items;
  }, [provider, itemMeta?.state, itemFilters]);
}

const ItemRow = memo(({ item, style, isSelected, onClick }: { item: EffectiveItem, style: React.CSSProperties, isSelected: boolean, onClick: (id: number) => void }) => {
  const folderInfo = getItemFolderInfo(item);

  return (
    <div 
      style={style}
      className={`flex items-center px-3 cursor-pointer text-xs border-b border-[#27272a] hover:bg-[#27272a] ${isSelected ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : 'border-l-2 border-l-transparent'}`}
      onClick={() => onClick(item.id)}
    >
      <div className="w-16 text-neutral-400 font-mono">{item.id}</div>
      <div className="flex-1 truncate font-medium text-neutral-200" title={item.fields.AegisName}>{item.fields.AegisName}</div>
      <div className="flex-1 truncate text-neutral-400" title={item.fields.Name}>{item.fields.Name}</div>
      <div className="w-24 truncate text-neutral-400 text-center">{item.fields.Type || 'Usable'}</div>
      <div className="w-20 text-right pr-1">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${folderInfo.colorClass}`}>
          {folderInfo.label}
        </span>
      </div>
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
        <div className="flex-1">AEGIS NAME</div>
        <div className="flex-1">NAME</div>
        <div className="w-24 text-center">TYPE</div>
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

