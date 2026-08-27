import { useEffect, useState } from 'react';
import { Database, Play, Loader2, Sword, Skull, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { ItemExplorerView } from './items/ItemExplorerView';
import { MobExplorerView } from './mobs/MobExplorerView';
import { SkillExplorerView } from './skills/SkillExplorerView';

interface DatabaseLoadItem {
  id: 'item' | 'mob' | 'skill';
  name: string;
  description: string;
  icon: typeof Sword;
  color: string;
}

const AVAILABLE_DATABASES: DatabaseLoadItem[] = [
  {
    id: 'item',
    name: 'Item Database',
    description: 'item_db.yml, item_db_usable, item_db_equip, item_db_etc, db/import',
    icon: Sword,
    color: 'text-sky-400',
  },
  {
    id: 'mob',
    name: 'Monster Database',
    description: 'mob_db.yml, mob_avail_db.yml, db/import',
    icon: Skull,
    color: 'text-amber-400',
  },
  {
    id: 'skill',
    name: 'Skill Database',
    description: 'skill_db.yml, db/import',
    icon: Zap,
    color: 'text-emerald-400',
  },
];

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

  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [currentLoadingStep, setCurrentLoadingStep] = useState<string | null>(null);

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

  const loadedCount = [itemMeta, mobMeta, skillMeta].filter((m) => m?.state === 'loaded').length;
  const isAnyLoaded = loadedCount > 0;
  const totalDatabases = AVAILABLE_DATABASES.length;
  const loadingProgressPercent = Math.round((loadedCount / totalDatabases) * 100);

  const handleLoadAllDatabases = async () => {
    if (!activeWorkspace || isBulkLoading) return;

    setIsBulkLoading(true);

    try {
      // 1. Items
      setCurrentLoadingStep('Carregando Itens...');
      await loadDatabase('item', activeWorkspace.rootPath);

      // 2. Monsters
      setCurrentLoadingStep('Carregando Monstros...');
      await loadDatabase('mob', activeWorkspace.rootPath);

      // 3. Skills
      setCurrentLoadingStep('Carregando Habilidades...');
      await loadDatabase('skill', activeWorkspace.rootPath);

      setCurrentLoadingStep('Finalizando...');
      setActiveDatabase('item');
    } catch (err) {
      console.error('Error loading databases:', err);
    } finally {
      setIsBulkLoading(false);
      setCurrentLoadingStep(null);
    }
  };

  // Sub-header for switching between active databases when loaded
  if (isAnyLoaded && !isBulkLoading) {
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
      <Card className="max-w-xl w-full bg-[#1f1f23] border-[#27272a] shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-2 w-fit">
            <Database className="h-6 w-6 text-sky-400" />
          </div>
          <CardTitle className="text-sm font-semibold text-neutral-100">Database Explorer</CardTitle>
          <CardDescription className="text-xs text-neutral-400 truncate max-w-md mx-auto" title={activeWorkspace.rootPath}>
            Workspace: {activeWorkspace.rootPath}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Target Variant Selector */}
          <div className="flex items-center justify-between p-3 rounded bg-[#141416] border border-[#27272a] text-xs">
            <div>
              <div className="font-medium text-neutral-200">Target Variant</div>
              <div className="text-[11px] text-neutral-500">Selecione o modo de compatibilidade do servidor</div>
            </div>
            <div className="flex bg-[#1f1f23] p-1 rounded border border-[#27272a]">
              <button
                type="button"
                className={`px-3 py-1 rounded-l text-xs transition-all ${
                  activeVariant === 'RE'
                    ? 'bg-sky-600 text-white font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setVariant('RE')}
                disabled={isBulkLoading}
              >
                Renewal
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-r text-xs transition-all ${
                  activeVariant === 'PRE_RE'
                    ? 'bg-sky-600 text-white font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setVariant('PRE_RE')}
                disabled={isBulkLoading}
              >
                Pre-Renewal
              </button>
            </div>
          </div>

          {/* Included Databases Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300">Bancos de Dados para Carregamento</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {loadedCount} de {totalDatabases} prontos
              </span>
            </div>

            <div className="space-y-1.5">
              {AVAILABLE_DATABASES.map((db) => {
                const meta = metadataMap[db.id];
                const IconComponent = db.icon;
                const isLoaded = meta?.state === 'loaded';
                const isLoading = meta?.state === 'loading';
                const isError = meta?.state === 'error';

                return (
                  <div
                    key={db.id}
                    className={`flex items-center justify-between p-2.5 rounded border transition-all ${
                      isLoading
                        ? 'bg-sky-950/20 border-sky-500/40'
                        : isLoaded
                        ? 'bg-[#141416] border-[#27272a]'
                        : 'bg-[#141416]/60 border-[#27272a]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded bg-[#1f1f23] border border-[#27272a] shrink-0">
                        <IconComponent className={`w-4 h-4 ${db.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-neutral-200 truncate">{db.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate font-mono">{db.description}</div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isLoaded && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{meta.entityCount} registros</span>
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-mono">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Carregando...</span>
                        </div>
                      )}
                      {isError && (
                        <div className="flex items-center gap-1 text-[11px] text-red-400 font-mono">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Falha</span>
                        </div>
                      )}
                      {!isLoaded && !isLoading && !isError && (
                        <span className="text-[11px] text-neutral-500 font-mono">Pendente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar & Status Text (Visible when loading) */}
          {isBulkLoading && (
            <div className="space-y-1.5 p-3 rounded bg-[#141416] border border-[#27272a]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-sky-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {currentLoadingStep || 'Processando arquivos...'}
                </span>
                <span className="text-neutral-400">{loadingProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(loadingProgressPercent, 10)}%` }}
                />
              </div>
            </div>
          )}

          {/* Unified Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleLoadAllDatabases}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-xs py-2.5 rounded shadow-sm transition-all"
            >
              {isBulkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando Dados do Servidor ({activeVariant === 'RE' ? 'Renewal' : 'Pre-Renewal'})...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Carregar Todos os Bancos de Dados ({activeVariant === 'RE' ? 'Renewal' : 'Pre-Renewal'})</span>
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
