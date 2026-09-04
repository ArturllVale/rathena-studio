import { useProblemsStore } from '@/stores/problemsStore';
import { useAppStore } from '@/stores/appStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { AlertCircle, AlertTriangle, Info, Package, Database, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProblemsView() {
  const problems = useProblemsStore((s) => s.problems);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setActiveDatabase = useDatabaseStore((s) => s.setActiveDatabase);
  const setSelectedItemId = useDatabaseStore((s) => s.setSelectedItemId);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'item': return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'system': return <Cpu className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <Database className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const handleProblemClick = (problem: any) => {
    if (problem.source === 'item' && problem.sourceId) {
      setActiveDatabase('item');
      setSelectedItemId(problem.sourceId);
      setActiveTab('databases');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="flex flex-col border-b border-border/60 bg-card/40 p-4">
        <h2 className="text-xl font-semibold tracking-tight">Problems</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {problems.length} {problems.length === 1 ? 'problem' : 'problems'} found in the workspace
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="h-16 w-16 rounded-full bg-accent/50 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No problems found</p>
            <p className="text-xs">Your workspace looks clean and healthy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {problems.map((problem) => (
              <div 
                key={problem.id}
                onClick={() => handleProblemClick(problem)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-md border border-border/50 bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer group",
                  problem.severity === 'error' ? "hover:border-rose-500/30" : "hover:border-yellow-500/30"
                )}
              >
                <div className="mt-0.5">
                  {getSeverityIcon(problem.severity)}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                      {problem.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {getSourceIcon(problem.source)}
                      <span className="capitalize">{problem.source} Database</span>
                    </span>
                    {problem.sourceId && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="font-mono">ID: {problem.sourceId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
