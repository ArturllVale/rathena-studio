import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemToolbar } from './ItemToolbar';
import { ItemVirtualList } from './ItemVirtualList';
import { ItemInspector } from './ItemInspector';

export function ItemExplorerView() {
  const selectedItemId = useDatabaseStore((s) => s.selectedItemId);

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <ItemToolbar />
        <div className="flex-1 overflow-hidden">
          <ItemVirtualList />
        </div>
      </div>
      
      {selectedItemId !== null ? (
        <div className="w-[440px] shrink-0 bg-[#1f1f23] overflow-y-auto">
          <ItemInspector itemId={selectedItemId} />
        </div>
      ) : (
        <div className="w-[440px] shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select an item to view details
        </div>
      )}
    </div>
  );
}
