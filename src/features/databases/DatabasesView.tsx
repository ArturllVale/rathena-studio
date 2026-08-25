import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Database, AlertCircle, RefreshCw, Layers, CheckCircle, Clock, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatabaseVariant } from '@/domain/database/common/databaseVariant';

export function DatabasesView() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const context = useDatabaseStore((s) => s.context);
  const metadatas = useDatabaseStore((s) => s.metadatas);
  const setVariant = useDatabaseStore((s) => s.setVariant);
  const loadDatabase = useDatabaseStore((s) => s.loadDatabase);
  const unloadDatabase = useDatabaseStore((s) => s.unloadDatabase);

  const itemMeta = metadatas['items'] || {
    id: 'items',
    name: 'Items',
    variant: context.variant,
    entityCount: 0,
    files: [],
    status: 'unloaded',
    isDirty: false,
  };

  const handleVariantChange = (newVariant: DatabaseVariant) => {
    setVariant(newVariant);
  };

  const handleToggleLoad = (id: string) => {
    if (itemMeta.status === 'loaded') {
      unloadDatabase(id);
    } else {
      loadDatabase(id);
    }
  };

  const renderStatusBadge = () => {
    switch (itemMeta.status) {
      case 'loaded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" /> Loaded
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="h-3 w-3 animate-spin" /> Loading
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Error
          </span>
        );
      case 'unloaded':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
            <Clock className="h-3 w-3" /> Not Loaded
          </span>
        );
    }
  };

  return (
    <div className="h-full w-full p-6 flex flex-col items-center justify-start bg-[#18181b] overflow-auto space-y-6">
      {/* Header controls */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-[#1f1f23] p-4 rounded-xl border border-[#27272a]">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Database className="h-4 w-4 text-sky-400" /> rAthena Workspace Databases
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Workspace: {activeWorkspace ? activeWorkspace.name : 'No active workspace selected'}
          </p>
        </div>

        {/* Variant selector */}
        <div className="flex items-center gap-2 bg-[#141416] p-1 rounded-lg border border-[#27272a]">
          <button
            type="button"
            onClick={() => handleVariantChange('RE')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              context.variant === 'RE'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            RE (Renewal)
          </button>
          <button
            type="button"
            onClick={() => handleVariantChange('PRE_RE')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              context.variant === 'PRE_RE'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            PRE-RE (Pre-Renewal)
          </button>
        </div>
      </div>

      {/* Database Cards List */}
      <div className="w-full max-w-2xl space-y-4">
        <Card className="bg-[#1f1f23] border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                <Layers className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-neutral-100 flex items-center gap-2">
                  {itemMeta.name}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    item_db
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  {itemMeta.status === 'loaded'
                    ? `${itemMeta.entityCount.toLocaleString()} entities`
                    : 'Item Database Provider'}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {renderStatusBadge()}
              <Button
                variant={itemMeta.status === 'loaded' ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleToggleLoad('items')}
                disabled={itemMeta.status === 'loading'}
                className="text-xs h-8"
              >
                {itemMeta.status === 'loaded' ? 'Unload' : 'Load Database'}
              </Button>
            </div>
          </CardHeader>

          {itemMeta.status === 'loaded' && (
            <CardContent className="pt-0 space-y-3">
              <div className="bg-[#141416] p-3 rounded-lg border border-[#27272a] space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-neutral-400" /> Layer Files Involved ({itemMeta.files.length})
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Variant: {itemMeta.variant}
                  </span>
                </div>
                <ul className="space-y-1 font-mono text-[11px] text-neutral-400 bg-[#18181b] p-2 rounded border border-[#27272a]">
                  {itemMeta.files.map((file) => (
                    <li key={file} className="truncate">
                      • {file}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          )}

          {itemMeta.status === 'error' && (
            <CardContent className="pt-0">
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-300">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Loading Error
                </p>
                <p className="mt-1 font-mono text-[11px] text-rose-400">{itemMeta.error}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
