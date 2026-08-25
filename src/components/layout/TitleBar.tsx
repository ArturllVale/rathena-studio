import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAppStore } from '@/stores/appStore';
import { FolderGit2, HardDrive, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TitleBar() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isTauri = useAppStore((s) => s.isTauri);

  return (
    <header className="h-9 w-full bg-[#141416] border-b border-[#27272a] flex items-center justify-between px-3 text-xs select-none z-30">
      {/* App branding & Identity */}
      <div className="flex items-center gap-2.5 font-medium">
        <div className="flex items-center gap-1.5 text-neutral-200">
          <FolderGit2 className="h-4 w-4 text-sky-400" />
          <span className="font-semibold tracking-wide text-neutral-100">rAthena Studio</span>
          <span className="text-[10px] text-neutral-500 font-mono">v0.1.0</span>
        </div>

        <div className="h-3.5 w-px bg-neutral-800" />

        {/* Workspace indicator */}
        <div className="flex items-center gap-1.5 text-neutral-400">
          <HardDrive className="h-3.5 w-3.5 text-neutral-500" />
          {activeWorkspace ? (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-200 font-mono text-[11px]">{activeWorkspace.name}</span>
              <span className="text-[10px] text-neutral-500 truncate max-w-xs font-mono">({activeWorkspace.rootPath})</span>
            </div>
          ) : (
            <span className="text-neutral-500 italic">No workspace open</span>
          )}
        </div>
      </div>

      {/* Right controls / Environment Badge */}
      <div className="flex items-center gap-2">
        {isTauri ? (
          <Badge variant="success" className="h-5 gap-1 font-mono text-[10px] py-0 px-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Tauri 2 Native
          </Badge>
        ) : (
          <Badge variant="warning" className="h-5 gap-1 font-mono text-[10px] py-0 px-1.5">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            Web Mode
          </Badge>
        )}
      </div>
    </header>
  );
}
