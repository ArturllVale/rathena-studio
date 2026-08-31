import { useDatabaseStore } from '@/stores/databaseStore';
import { ComboToolbar } from './ComboToolbar';
import { ComboVirtualList } from './ComboVirtualList';
import { ComboInspector } from './ComboInspector';

export function ComboExplorerView() {
  const selectedComboKey = useDatabaseStore((s) => s.selectedComboKey);

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <ComboToolbar />
        <div className="flex-1 overflow-hidden">
          <ComboVirtualList />
        </div>
      </div>

      {selectedComboKey !== null ? (
        <div className="w-[440px] shrink-0 bg-[#1f1f23] overflow-y-auto">
          <ComboInspector comboKey={selectedComboKey} />
        </div>
      ) : (
        <div className="w-[440px] shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select an item combo to view details
        </div>
      )}
    </div>
  );
}
