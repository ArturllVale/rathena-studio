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
      colorClass: 'bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25',
    };
  }

  const hasPreRe =
    item.layerProvenance.some((l) => l.toLowerCase().includes('pre-re')) ||
    item.databaseVariant === 'PRE_RE';

  if (hasPreRe) {
    return {
      label: 'PRE-RE',
      isImport: false,
      colorClass: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
    };
  }

  return {
    label: 'RE',
    isImport: false,
    colorClass: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25',
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
  }, [provider, itemMeta, itemFilters]);
}

const ItemRow = memo(({ item, style, isSelected, onClick }: { item: EffectiveItem, style: React.CSSProperties, isSelected: boolean, onClick: (id: number) => void }) => {
  const folderInfo = getItemFolderInfo(item);

  return (
    <div 
      style={style}
      className={`flex items-center px-4 cursor-pointer text-xs border-b border-border/60 transition-colors ${
        isSelected
          ? 'bg-primary/10 border-l-4 border-l-primary text-foreground font-medium'
          : 'border-l-4 border-l-transparent hover:bg-accent/60 text-muted-foreground'
      }`}
      onClick={() => onClick(item.id)}
    >
      <div className="w-20 font-mono text-xs text-muted-foreground font-semibold">#{item.id}</div>
      <div className="flex-1 truncate font-medium text-foreground text-sm" title={item.fields.AegisName}>{item.fields.AegisName}</div>
      <div className="flex-1 truncate text-xs text-muted-foreground" title={item.fields.Name}>{item.fields.Name}</div>
      <div className="w-28 truncate text-xs text-muted-foreground text-center font-medium">{item.fields.Type || 'Usable'}</div>
      <div className="w-24 text-right pr-2">
        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-mono border ${folderInfo.colorClass}`}>
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
    estimateSize: () => 44, // 44px comfortable height per row
    overscan: 10,
  });

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center px-4 py-3 bg-secondary/50 text-xs font-semibold text-muted-foreground border-b border-border/80 uppercase tracking-wider select-none">
        <div className="w-20">ID</div>
        <div className="flex-1">AEGIS NAME</div>
        <div className="flex-1">NAME</div>
        <div className="w-28 text-center">TYPE</div>
        <div className="w-24 text-right pr-3">FOLDER</div>
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
          <div className="p-8 text-center text-sm text-muted-foreground">
            No items found matching the filters.
          </div>
        )}
      </div>
    </div>
  );
}

