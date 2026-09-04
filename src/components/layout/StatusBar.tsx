import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAppStore } from '@/stores/appStore';
import { CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

export function StatusBar() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const error = useWorkspaceStore((s) => s.error);
  const isTauri = useAppStore((s) => s.isTauri);

  return (
    <footer className="h-7 w-full bg-card/90 backdrop-blur border-t border-border/80 flex items-center justify-between px-4 text-xs text-muted-foreground font-mono select-none z-30">
      <div className="flex items-center gap-4">
        {/* Workspace status */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-primary">
              <Activity className="h-3.5 w-3.5 animate-spin" />
              Scanning Workspace...
            </span>
          ) : activeWorkspace ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Workspace Ready
            </span>
          ) : (
            <span className="text-muted-foreground">Ready</span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{error.message}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
        <span>Target: {isTauri ? 'Desktop (Tauri 2)' : 'Vite Browser'}</span>
        <span className="h-3 w-px bg-border/80" />
        <span>UTF-8</span>
      </div>
    </footer>
  );
}
