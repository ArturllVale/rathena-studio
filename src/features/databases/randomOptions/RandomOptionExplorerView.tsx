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
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-border/80 overflow-hidden min-w-[320px]">
        <RandomOptionToolbar />
        <div className="flex-1 overflow-hidden">
          <RandomOptionVirtualList />
        </div>
      </div>

      {hasSelection ? (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card border-l border-border/80 overflow-y-auto transition-all">
          <RandomOptionInspector
            optionId={!isGroupTab ? selectedRandomOptId : null}
            groupId={isGroupTab ? selectedRandomGroupId : null}
          />
        </div>
      ) : (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card/60 flex items-center justify-center text-muted-foreground text-sm border-l border-border/80">
          Select an item to view details
        </div>
      )}
    </div>
  );
}
