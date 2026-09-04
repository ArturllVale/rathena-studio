import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemGroupToolbar } from './ItemGroupToolbar';
import { ItemGroupVirtualList } from './ItemGroupVirtualList';
import { ItemGroupInspector } from './ItemGroupInspector';

export function ItemGroupExplorerView() {
  const selectedGroupKey = useDatabaseStore((s) => s.selectedGroupKey);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-border/80 overflow-hidden min-w-[320px]">
        <ItemGroupToolbar />
        <div className="flex-1 overflow-hidden">
          <ItemGroupVirtualList />
        </div>
      </div>

      {selectedGroupKey !== null ? (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card border-l border-border/80 overflow-y-auto transition-all">
          <ItemGroupInspector groupKey={selectedGroupKey} />
        </div>
      ) : (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card/60 flex items-center justify-center text-muted-foreground text-sm border-l border-border/80">
          Select an item group to view details
        </div>
      )}
    </div>
  );
}
