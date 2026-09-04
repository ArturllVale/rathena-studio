import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAppStore } from '@/stores/appStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { CheckCircle2, AlertTriangle, Activity, AlertCircle } from 'lucide-react';

export function StatusBar() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const error = useWorkspaceStore((s) => s.error);
  const isTauri = useAppStore((s) => s.isTauri);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  
  const problems = useProblemsStore((s) => s.problems);
  const errorsCount = problems.filter(p => p.severity === 'error').length;
  const warningsCount = problems.filter(p => p.severity === 'warning').length;
  const hasProblems = errorsCount > 0 || warningsCount > 0;

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

        {hasProblems && (
          <button 
            onClick={() => setActiveTab('problems')}
            className="flex items-center gap-1.5 hover:bg-accent hover:text-accent-foreground px-1.5 rounded transition-colors"
            title="View Problems"
          >
            {errorsCount > 0 && (
              <span className="flex items-center gap-1 text-rose-500">
                <AlertCircle className="h-3.5 w-3.5" /> {errorsCount}
              </span>
            )}
            {warningsCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-500">
                <AlertTriangle className="h-3.5 w-3.5" /> {warningsCount}
              </span>
            )}
          </button>
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
