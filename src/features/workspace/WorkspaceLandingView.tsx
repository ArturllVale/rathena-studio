import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Layers, 
  FolderGit2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  FileCode, 
  Server,
  XCircle,
  Loader2
} from 'lucide-react';

export function WorkspaceLandingView() {
  const { activeWorkspace, isLoading, error, openWorkspaceDirectory, closeWorkspace, clearError } =
    useWorkspaceStore();

  return (
    <div className="h-full w-full overflow-auto p-8 lg:p-12 flex flex-col items-center justify-center bg-background text-foreground">
      <div className="max-w-2xl w-full flex flex-col space-y-8">
        {/* Main Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-4 bg-pastel-blue/15 border border-pastel-blue/30 rounded-2xl mb-1 shadow-xs">
            <FolderGit2 className="h-10 w-10 text-pastel-blue" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            rAthena Studio
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Development Environment for rAthena
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-xs text-destructive flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <span>{error.message}</span>
            </div>
            <button
              onClick={clearError}
              className="text-muted-foreground hover:text-foreground text-xs ml-3 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace State Card */}
        <Card className="border-border/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Workspace Status</CardTitle>
              </div>
              {activeWorkspace ? (
                <Badge variant="success" className="gap-1.5 font-mono text-xs px-2.5 py-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-mono text-xs text-muted-foreground px-2.5 py-0.5">
                  No workspace selected
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {activeWorkspace
                ? 'Target directory configured for rAthena server repository.'
                : 'Select an rAthena server root directory to initialize the workspace engine.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {activeWorkspace ? (
              <div className="space-y-3.5">
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80 space-y-1">
                  <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider font-semibold">
                    Root Path
                  </div>
                  <div className="text-xs font-mono text-foreground break-all">
                    {activeWorkspace.rootPath}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/20 p-3 rounded-xl border border-border/80 flex items-center gap-3">
                    <Database className="h-5 w-5 text-pastel-blue shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground font-mono">Database</div>
                      <div className="text-xs font-mono text-foreground font-medium truncate">
                        {activeWorkspace.detectedPaths?.dbPath ? 'db/' : 'Not found'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-xl border border-border/80 flex items-center gap-3">
                    <FileCode className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground font-mono">Configuration</div>
                      <div className="text-xs font-mono text-foreground font-medium truncate">
                        {activeWorkspace.detectedPaths?.confPath ? 'conf/' : 'Not found'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-xl border border-border/80 flex items-center gap-3">
                    <Server className="h-5 w-5 text-mint shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground font-mono">NPC Scripts</div>
                      <div className="text-xs font-mono text-foreground font-medium truncate">
                        {activeWorkspace.detectedPaths?.npcPath ? 'npc/' : 'Not found'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-border rounded-xl bg-muted/20">
                <div className="p-3 bg-secondary rounded-xl">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Choose the root folder of your rAthena repository
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Must contain db/, conf/, or server configuration files
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-3 flex items-center justify-between border-t border-border/80">
            {activeWorkspace ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeWorkspace}
                  className="text-xs gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Close Workspace
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={openWorkspaceDirectory}
                  disabled={isLoading}
                  className="text-xs gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FolderOpen className="h-3.5 w-3.5" />
                  )}
                  Switch Directory
                </Button>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <Button
                  variant="default"
                  size="lg"
                  onClick={openWorkspaceDirectory}
                  disabled={isLoading}
                  className="w-full max-w-sm gap-2.5 text-xs font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening Directory...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4" />
                      Open rAthena Workspace
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
