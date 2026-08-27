import { useDatabaseStore } from '@/stores/databaseStore';
import { MobToolbar } from './MobToolbar';
import { MobVirtualList } from './MobVirtualList';
import { MobInspector } from './MobInspector';

export function MobExplorerView() {
  const selectedMobId = useDatabaseStore((s) => s.selectedMobId);

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <MobToolbar />
        <div className="flex-1 overflow-hidden">
          <MobVirtualList />
        </div>
      </div>

      {selectedMobId !== null ? (
        <div className="w-[440px] flex-shrink-0 bg-[#1f1f23] overflow-y-auto">
          <MobInspector mobId={selectedMobId} />
        </div>
      ) : (
        <div className="w-[440px] flex-shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select a monster to view details
        </div>
      )}
    </div>
  );
}
