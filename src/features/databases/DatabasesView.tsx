import { useEffect } from 'react';
import { Database, Play, Loader2, Sword, Skull, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemExplorerView } from './items/ItemExplorerView';
import { MobExplorerView } from './mobs/MobExplorerView';
import { SkillExplorerView } from './skills/SkillExplorerView';

export function DatabasesView() {
  const { activeWorkspace } = useWorkspaceStore();
  const {
    initializeWorkspace,
    clearWorkspace,
    activeVariant,
    setVariant,
    activeDatabase,
    setActiveDatabase,
    loadDatabase,
    metadataMap,
  } = useDatabaseStore();

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
  const mobMeta = metadataMap['mob'];
  const skillMeta = metadataMap['skill'];

  // Sub-header for switching between active databases when loaded
  const isAnyLoaded =
    itemMeta?.state === 'loaded' || mobMeta?.state === 'loaded' || skillMeta?.state === 'loaded';

  if (isAnyLoaded) {
    return (
      <div className="h-full w-full flex flex-col bg-[#18181b] overflow-hidden">
        {/* Database Switcher Navigation Bar */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-[#141416] border-b border-[#27272a]">
          <button
            type="button"
            onClick={() => {
              setActiveDatabase('item');
              if (itemMeta?.state === 'not_loaded') {
                loadDatabase('item', activeWorkspace.rootPath);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeDatabase === 'item'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23]'
            }`}
          >
            <Sword className="w-3.5 h-3.5" />
            <span>Items</span>
            {itemMeta?.state === 'loaded' && (
              <span className="text-[10px] opacity-75 font-mono">({itemMeta.entityCount})</span>
            )}
            {itemMeta?.state === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDatabase('mob');
              if (mobMeta?.state === 'not_loaded') {
                loadDatabase('mob', activeWorkspace.rootPath);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeDatabase === 'mob'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23]'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Monsters</span>
            {mobMeta?.state === 'loaded' && (
              <span className="text-[10px] opacity-75 font-mono">({mobMeta.entityCount})</span>
            )}
            {mobMeta?.state === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDatabase('skill');
              if (skillMeta?.state === 'not_loaded') {
                loadDatabase('skill', activeWorkspace.rootPath);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeDatabase === 'skill'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Skills</span>
            {skillMeta?.state === 'loaded' && (
              <span className="text-[10px] opacity-75 font-mono">({skillMeta.entityCount})</span>
            )}
            {skillMeta?.state === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
          </button>
        </div>

        {/* Database View Body */}
        <div className="flex-1 overflow-hidden">
          {activeDatabase === 'item' && itemMeta?.state === 'loaded' && <ItemExplorerView />}
          {activeDatabase === 'mob' && mobMeta?.state === 'loaded' && <MobExplorerView />}
          {activeDatabase === 'skill' && skillMeta?.state === 'loaded' && <SkillExplorerView />}

          {activeDatabase === 'item' && itemMeta?.state !== 'loaded' && (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="text-neutral-400 text-xs">Item Database is not loaded.</div>
              <button
                onClick={() => loadDatabase('item', activeWorkspace.rootPath)}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded font-medium"
              >
                <Play className="w-3.5 h-3.5" /> Load Item Database
              </button>
            </div>
          )}
          {activeDatabase === 'mob' && mobMeta?.state !== 'loaded' && (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="text-neutral-400 text-xs">Monster Database is not loaded.</div>
              <button
                onClick={() => loadDatabase('mob', activeWorkspace.rootPath)}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded font-medium"
              >
                <Play className="w-3.5 h-3.5" /> Load Monster Database
              </button>
            </div>
          )}
          {activeDatabase === 'skill' && skillMeta?.state !== 'loaded' && (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="text-neutral-400 text-xs">Skill Database is not loaded.</div>
              <button
                onClick={() => loadDatabase('skill', activeWorkspace.rootPath)}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded font-medium"
              >
                <Play className="w-3.5 h-3.5" /> Load Skill Database
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-[#18181b] overflow-auto">
      <Card className="max-w-lg w-full bg-[#1f1f23] border-[#27272a]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-2 w-fit">
            <Database className="h-6 w-6 text-sky-400" />
          </div>
          <CardTitle className="text-sm font-medium text-neutral-100">Database Explorer</CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Workspace: {activeWorkspace.rootPath}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300">Target Variant:</span>
            <div className="flex bg-[#141416] p-1 rounded border border-[#27272a]">
              <button
                className={`px-3 py-1 rounded-l ${
                  activeVariant === 'RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'
                }`}
                onClick={() => setVariant('RE')}
                disabled={
                  itemMeta?.state === 'loading' ||
                  mobMeta?.state === 'loading' ||
                  skillMeta?.state === 'loading'
                }
              >
                Renewal
              </button>
              <button
                className={`px-3 py-1 rounded-r ${
                  activeVariant === 'PRE_RE' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-neutral-500'
                }`}
                onClick={() => setVariant('PRE_RE')}
                disabled={
                  itemMeta?.state === 'loading' ||
                  mobMeta?.state === 'loading' ||
                  skillMeta?.state === 'loading'
                }
              >
                Pre-Renewal
              </button>
            </div>
          </div>

          {/* Item Database Card */}
          <div className="bg-[#141416] p-4 rounded border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-sky-400" />
                <div className="text-sm font-medium text-neutral-200">Item Database</div>
              </div>
              {itemMeta?.state === 'not_loaded' && (
                <button
                  className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded font-medium"
                  onClick={() => {
                    setActiveDatabase('item');
                    loadDatabase('item', activeWorkspace.rootPath);
                  }}
                >
                  <Play className="w-3 h-3" /> Load
                </button>
              )}
              {itemMeta?.state === 'loading' && (
                <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              )}
              {itemMeta?.state === 'error' && <div className="text-xs text-red-400">Error</div>}
            </div>
          </div>

          {/* Monster Database Card */}
          <div className="bg-[#141416] p-4 rounded border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-amber-400" />
                <div className="text-sm font-medium text-neutral-200">Monster Database</div>
              </div>
              {mobMeta?.state === 'not_loaded' && (
                <button
                  className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded font-medium"
                  onClick={() => {
                    setActiveDatabase('mob');
                    loadDatabase('mob', activeWorkspace.rootPath);
                  }}
                >
                  <Play className="w-3 h-3" /> Load
                </button>
              )}
              {mobMeta?.state === 'loading' && (
                <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              )}
              {mobMeta?.state === 'error' && <div className="text-xs text-red-400">Error</div>}
            </div>
          </div>

          {/* Skill Database Card */}
          <div className="bg-[#141416] p-4 rounded border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div className="text-sm font-medium text-neutral-200">Skill Database</div>
              </div>
              {skillMeta?.state === 'not_loaded' && (
                <button
                  className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded font-medium"
                  onClick={() => {
                    setActiveDatabase('skill');
                    loadDatabase('skill', activeWorkspace.rootPath);
                  }}
                >
                  <Play className="w-3 h-3" /> Load
                </button>
              )}
              {skillMeta?.state === 'loading' && (
                <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              )}
              {skillMeta?.state === 'error' && <div className="text-xs text-red-400">Error</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
