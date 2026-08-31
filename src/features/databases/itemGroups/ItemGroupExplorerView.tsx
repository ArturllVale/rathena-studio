import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemGroupToolbar } from './ItemGroupToolbar';
import { ItemGroupVirtualList } from './ItemGroupVirtualList';
import { ItemGroupInspector } from './ItemGroupInspector';

export function ItemGroupExplorerView() {
  const selectedGroupKey = useDatabaseStore((s) => s.selectedGroupKey);

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <ItemGroupToolbar />
        <div className="flex-1 overflow-hidden">
          <ItemGroupVirtualList />
        </div>
      </div>

      {selectedGroupKey !== null ? (
        <div className="w-[480px] shrink-0 bg-[#1f1f23] overflow-y-auto">
          <ItemGroupInspector groupKey={selectedGroupKey} />
        </div>
      ) : (
        <div className="w-[480px] shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select an item group to view details
        </div>
      )}
    </div>
  );
}
