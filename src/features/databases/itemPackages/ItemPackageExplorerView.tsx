import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemPackageToolbar } from './ItemPackageToolbar';
import { ItemPackageVirtualList } from './ItemPackageVirtualList';
import { ItemPackageInspector } from './ItemPackageInspector';

export function ItemPackageExplorerView() {
  const selectedPackageName = useDatabaseStore((s) => s.selectedPackageName);

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <ItemPackageToolbar />
        <div className="flex-1 overflow-hidden">
          <ItemPackageVirtualList />
        </div>
      </div>

      {selectedPackageName !== null ? (
        <div className="w-[480px] shrink-0 bg-[#1f1f23] overflow-y-auto">
          <ItemPackageInspector packageName={selectedPackageName} />
        </div>
      ) : (
        <div className="w-[480px] shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select an item package to view details
        </div>
      )}
    </div>
  );
}
