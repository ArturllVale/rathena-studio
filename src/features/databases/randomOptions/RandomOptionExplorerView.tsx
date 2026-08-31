import { useDatabaseStore } from '@/stores/databaseStore';
import { RandomOptionToolbar } from './RandomOptionToolbar';
import { RandomOptionVirtualList } from './RandomOptionVirtualList';
import { RandomOptionInspector } from './RandomOptionInspector';

export function RandomOptionExplorerView() {
  const selectedRandomOptId = useDatabaseStore((s) => s.selectedRandomOptId);
  const selectedRandomGroupId = useDatabaseStore((s) => s.selectedRandomGroupId);
  const isGroupTab = useDatabaseStore((s) => s.randomOptFilters.tab === 'groups');

  const hasSelection = isGroupTab ? selectedRandomGroupId !== null : selectedRandomOptId !== null;

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <RandomOptionToolbar />
        <div className="flex-1 overflow-hidden">
          <RandomOptionVirtualList />
        </div>
      </div>

      {hasSelection ? (
        <div className="w-[440px] shrink-0 bg-[#1f1f23] overflow-y-auto">
          <RandomOptionInspector
            optionId={!isGroupTab ? selectedRandomOptId : null}
            groupId={isGroupTab ? selectedRandomGroupId : null}
          />
        </div>
      ) : (
        <div className="w-[440px] shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select an item to view details
        </div>
      )}
    </div>
  );
}
