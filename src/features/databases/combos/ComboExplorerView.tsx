import { useDatabaseStore } from '@/stores/databaseStore';
import { ComboToolbar } from './ComboToolbar';
import { ComboVirtualList } from './ComboVirtualList';
import { ComboInspector } from './ComboInspector';

export function ComboExplorerView() {
  const selectedComboKey = useDatabaseStore((s) => s.selectedComboKey);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-border/80 overflow-hidden min-w-[320px]">
        <ComboToolbar />
        <div className="flex-1 overflow-hidden">
          <ComboVirtualList />
        </div>
      </div>

      {selectedComboKey !== null ? (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card border-l border-border/80 overflow-y-auto transition-all">
          <ComboInspector comboKey={selectedComboKey} />
        </div>
      ) : (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card/60 flex items-center justify-center text-muted-foreground text-sm border-l border-border/80">
          Select an item combo to view details
        </div>
      )}
    </div>
  );
}
