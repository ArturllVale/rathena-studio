import { useEffect } from 'react';
import { Database, Play, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemExplorerView } from './items/ItemExplorerView';

export function DatabasesView() {
  const { activeWorkspace } = useWorkspaceStore();
  const { initializeWorkspace, clearWorkspace, activeVariant, setVariant, loadDatabase, metadataMap } = useDatabaseStore();

  useEffect(() => {
    if (activeWorkspace) {
      initializeWorkspace();
    } else {
      clearWorkspace();
    }
  }, [activeWorkspace, initializeWorkspace, clearWorkspace]);

  if (!activeWorkspace) {
    return (
      <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-[#18181b] overflow-auto">
        <div className="text-neutral-500 text-sm">No active workspace. Please open a workspace first.</div>
      </div>
    );
  }

  const itemMeta = metadataMap['item'];

  // If item database is loaded, we show the ItemExplorer directly
  if (itemMeta?.state === 'loaded') {
    return <ItemExplorerView />;
  }

  return (
    <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-[#18181b] overflow-auto">
      <Card className="max-w-lg w-full bg-[#1f1f23] border-[#27272a]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-2 w-fit">
            <Database className="h-6 w-6 text-sky-400" />
          </div>
          <CardTitle className="text-sm font-medium text-neutral-100">
            Database Explorer
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Workspace: {activeWorkspace.rootPath}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300">Target Variant:</span>
            <div className="flex bg-[#141416] p-1 rounded border border-[#27272a]">
              <button
                className={`px-3 py-1 rounded-l ${activeVariant === 'RE' ? 'bg-sky-500/20 text-sky-400' : 'text-neutral-500'}`}
                onClick={() => setVariant('RE')}
                disabled={itemMeta?.state === 'loading'}
              >
                Renewal
              </button>
              <button
                className={`px-3 py-1 rounded-r ${activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400' : 'text-neutral-500'}`}
                onClick={() => setVariant('PRE_RE')}
                disabled={itemMeta?.state === 'loading'}
              >
                Pre-Renewal
              </button>
            </div>
          </div>

          <div className="bg-[#141416] p-4 rounded border border-[#27272a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-neutral-200">Item Database</div>
              {itemMeta?.state === 'not_loaded' && (
                <button
                  className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded"
                  onClick={() => loadDatabase('item', activeWorkspace.rootPath)}
                >
                  <Play className="w-3 h-3" /> Load
                </button>
              )}
              {itemMeta?.state === 'loading' && (
                <div className="flex items-center gap-2 text-xs text-sky-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              )}
              {itemMeta?.state === 'error' && (
                <div className="text-xs text-red-400">Error</div>
              )}
            </div>
            
            {itemMeta?.state === 'error' && itemMeta.error && (
              <div className="text-xs text-red-400 bg-red-950/20 p-2 rounded break-all whitespace-pre-wrap">
                {itemMeta.error.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
