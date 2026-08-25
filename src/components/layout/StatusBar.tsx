import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAppStore } from '@/stores/appStore';
import { CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

export function StatusBar() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const error = useWorkspaceStore((s) => s.error);
  const isTauri = useAppStore((s) => s.isTauri);

  return (
    <footer className="h-6 w-full bg-[#111113] border-t border-[#27272a] flex items-center justify-between px-3 text-[11px] text-neutral-400 font-mono select-none z-30">
      <div className="flex items-center gap-3">
        {/* Workspace status */}
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <span className="flex items-center gap-1 text-sky-400">
              <Activity className="h-3 w-3 animate-spin" />
              Scanning...
            </span>
          ) : activeWorkspace ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Workspace Ready
            </span>
          ) : (
            <span className="text-neutral-500">Ready</span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1 text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            <span>{error.message}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-neutral-500">
        <span>Target: {isTauri ? 'Desktop (Tauri 2)' : 'Vite Browser'}</span>
        <span>UTF-8</span>
      </div>
    </footer>
  );
}
