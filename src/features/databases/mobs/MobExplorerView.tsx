import { useDatabaseStore } from '@/stores/databaseStore';
import { MobToolbar } from './MobToolbar';
import { MobVirtualList } from './MobVirtualList';
import { MobInspector } from './MobInspector';

export function MobExplorerView() {
  const selectedMobId = useDatabaseStore((s) => s.selectedMobId);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-border/80 overflow-hidden min-w-[320px]">
        <MobToolbar />
        <div className="flex-1 overflow-hidden">
          <MobVirtualList />
        </div>
      </div>

      {selectedMobId !== null ? (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card border-l border-border/80 overflow-y-auto transition-all">
          <MobInspector mobId={selectedMobId} />
        </div>
      ) : (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card/60 flex items-center justify-center text-muted-foreground text-sm border-l border-border/80">
          Select a monster to view details
        </div>
      )}
    </div>
  );
}
