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
    <div className="h-full w-full overflow-auto p-8 flex flex-col items-center justify-center bg-[#18181b]">
      <div className="max-w-2xl w-full flex flex-col space-y-6">
        {/* Main Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-2">
            <FolderGit2 className="h-8 w-8 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 font-sans">
            rAthena Studio
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            Development Environment for rAthena
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-md p-3 text-xs text-rose-300 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error.message}</span>
            </div>
            <button
              onClick={clearError}
              className="text-neutral-400 hover:text-neutral-200 text-xs ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace State Card */}
        <Card className="bg-[#1f1f23] border-[#27272a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-neutral-400" />
                <CardTitle className="text-sm font-medium">Workspace Status</CardTitle>
              </div>
              {activeWorkspace ? (
                <Badge variant="success" className="gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-mono text-[10px] text-neutral-400">
                  No workspace selected
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              {activeWorkspace
                ? 'Target directory configured for rAthena server repository.'
                : 'Select an rAthena server root directory to initialize the workspace engine.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {activeWorkspace ? (
              <div className="space-y-3">
                <div className="bg-[#141416] p-3 rounded-md border border-[#27272a] space-y-1">
                  <div className="text-[11px] text-neutral-500 font-mono uppercase tracking-wider">
                    Root Path
                  </div>
                  <div className="text-xs font-mono text-neutral-200 break-all">
                    {activeWorkspace.rootPath}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-[#141416] p-2.5 rounded border border-[#27272a] flex items-center gap-2">
                    <Database className="h-4 w-4 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-neutral-500 font-mono">Database</div>
                      <div className="text-xs font-mono text-neutral-300 truncate">
                        {activeWorkspace.detectedPaths.dbPath ? 'db/' : 'Not found'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#141416] p-2.5 rounded border border-[#27272a] flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-neutral-500 font-mono">Configuration</div>
                      <div className="text-xs font-mono text-neutral-300 truncate">
                        {activeWorkspace.detectedPaths.confPath ? 'conf/' : 'Not found'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#141416] p-2.5 rounded border border-[#27272a] flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-neutral-500 font-mono">NPC Scripts</div>
                      <div className="text-xs font-mono text-neutral-300 truncate">
                        {activeWorkspace.detectedPaths.npcPath ? 'npc/' : 'Not found'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-[#2e2e33] rounded-md bg-[#141416]/50">
                <FolderOpen className="h-8 w-8 text-neutral-600 mb-1" />
                <p className="text-xs text-neutral-400">
                  Choose the root folder of your rAthena repository.
                </p>
                <p className="text-[11px] text-neutral-600 font-mono">
                  Contains db/, conf/, and server binaries
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 flex items-center justify-between border-t border-[#27272a]">
            {activeWorkspace ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeWorkspace}
                  className="text-xs gap-1.5 text-neutral-400 hover:text-rose-400"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Close Workspace
                </Button>
                <Button
                  variant="ide"
                  size="sm"
                  onClick={openWorkspaceDirectory}
                  disabled={isLoading}
                  className="text-xs gap-1.5"
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
                  size="default"
                  onClick={openWorkspaceDirectory}
                  disabled={isLoading}
                  className="w-full max-w-sm gap-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white"
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
