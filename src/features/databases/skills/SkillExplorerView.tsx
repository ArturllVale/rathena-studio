import { useDatabaseStore } from '@/stores/databaseStore';
import { SkillToolbar } from './SkillToolbar';
import { SkillVirtualList } from './SkillVirtualList';
import { SkillInspector } from './SkillInspector';

export function SkillExplorerView() {
  const selectedSkillId = useDatabaseStore((s) => s.selectedSkillId);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 border-r border-border/80 overflow-hidden min-w-[320px]">
        <SkillToolbar />
        <div className="flex-1 overflow-hidden">
          <SkillVirtualList />
        </div>
      </div>

      {selectedSkillId !== null ? (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card border-l border-border/80 overflow-y-auto transition-all">
          <SkillInspector skillId={selectedSkillId} />
        </div>
      ) : (
        <div className="w-[420px] lg:w-[480px] xl:w-[540px] 2xl:w-[620px] ultrawide:w-[720px] shrink-0 bg-card/60 flex items-center justify-center text-muted-foreground text-sm border-l border-border/80">
          Select a skill to view details
        </div>
      )}
    </div>
  );
}
