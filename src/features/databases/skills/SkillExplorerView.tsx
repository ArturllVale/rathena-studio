import { useDatabaseStore } from '@/stores/databaseStore';
import { SkillToolbar } from './SkillToolbar';
import { SkillVirtualList } from './SkillVirtualList';
import { SkillInspector } from './SkillInspector';

export function SkillExplorerView() {
  const selectedSkillId = useDatabaseStore((s) => s.selectedSkillId);

  return (
    <div className="flex h-full w-full bg-[#18181b] overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-[#27272a] overflow-hidden min-w-[300px]">
        <SkillToolbar />
        <div className="flex-1 overflow-hidden">
          <SkillVirtualList />
        </div>
      </div>

      {selectedSkillId !== null ? (
        <div className="w-[450px] flex-shrink-0 bg-[#1f1f23] overflow-y-auto">
          <SkillInspector skillId={selectedSkillId} />
        </div>
      ) : (
        <div className="w-[450px] flex-shrink-0 bg-[#1f1f23] flex items-center justify-center text-neutral-500 text-sm border-l border-[#27272a]">
          Select a skill to view details
        </div>
      )}
    </div>
  );
}
