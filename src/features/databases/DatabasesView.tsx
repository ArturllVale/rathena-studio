import { useEffect, useState } from 'react';
import {
  Database,
  Play,
  Loader2,
  Sword,
  Skull,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Package,
  Dices,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { DatabaseProviderId } from '@/domain/database/provider/databaseProvider';
import { ItemExplorerView } from './items/ItemExplorerView';
import { MobExplorerView } from './mobs/MobExplorerView';
import { SkillExplorerView } from './skills/SkillExplorerView';
import { ComboExplorerView } from './combos/ComboExplorerView';
import { ItemGroupExplorerView } from './itemGroups/ItemGroupExplorerView';
import { ItemPackageExplorerView } from './itemPackages/ItemPackageExplorerView';
import { RandomOptionExplorerView } from './randomOptions/RandomOptionExplorerView';

interface DatabaseLoadItem {
  id: DatabaseProviderId;
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
    color: 'text-pastel-blue',
  },
  {
    id: 'mob',
    name: 'Monster Database',
    description: 'mob_db.yml, mob_avail_db.yml, db/import',
    icon: Skull,
    color: 'text-pastel-amber',
  },
  {
    id: 'skill',
    name: 'Skill Database',
    description: 'skill_db.yml, db/import',
    icon: Zap,
    color: 'text-pastel-mint',
  },
  {
    id: 'combo',
    name: 'Item Combos',
    description: 'item_combos.yml, db/import/item_combos.yml',
    icon: Sparkles,
    color: 'text-pastel-peach',
  },
  {
    id: 'group',
    name: 'Item Groups',
    description: 'item_group_db.yml, db/import/item_group_db.yml',
    icon: Layers,
    color: 'text-pastel-periwinkle',
  },
  {
    id: 'package',
    name: 'Item Packages',
    description: 'item_packages.yml, db/import/item_packages.yml',
    icon: Package,
    color: 'text-pastel-lavender',
  },
  {
    id: 'randomopt',
    name: 'Random Options',
    description: 'item_randomopt_db.yml, item_randomopt_group.yml, db/import',
    icon: Dices,
    color: 'text-pastel-rose',
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
      <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-background overflow-auto">
        <div className="text-muted-foreground text-sm">No active workspace. Please open a workspace first.</div>
      </div>
    );
  }

  const loadedCount = Object.values(metadataMap).filter((m) => m?.state === 'loaded').length;
  const isAnyLoaded = loadedCount > 0;
  const totalDatabases = AVAILABLE_DATABASES.length;
  const loadingProgressPercent = Math.round((loadedCount / totalDatabases) * 100);

  const handleLoadAllDatabases = async () => {
    if (!activeWorkspace || isBulkLoading) return;

    setIsBulkLoading(true);

    try {
      for (const db of AVAILABLE_DATABASES) {
        setCurrentLoadingStep(`Carregando ${db.name}...`);
        await loadDatabase(db.id, activeWorkspace.rootPath);
      }

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
      <div className="h-full w-full flex flex-col bg-background overflow-hidden">
        {/* Database Switcher Navigation Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-card border-b border-border/80 overflow-x-auto shadow-2xs">
          {AVAILABLE_DATABASES.map((db) => {
            const meta = metadataMap[db.id];
            const Icon = db.icon;
            const isActive = activeDatabase === db.id;

            return (
              <button
                key={db.id}
                type="button"
                onClick={() => {
                  setActiveDatabase(db.id);
                  if (meta?.state === 'not_loaded') {
                    loadDatabase(db.id, activeWorkspace.rootPath);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : db.color}`} />
                <span>{db.name.replace(' Database', '')}</span>
                {meta?.state === 'loaded' && (
                  <span className={`text-xs font-mono opacity-80 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    ({meta.entityCount})
                  </span>
                )}
                {meta?.state === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </button>
            );
          })}
        </div>

        {/* Database View Body */}
        <div className="flex-1 overflow-hidden">
          {activeDatabase === 'item' && metadataMap['item']?.state === 'loaded' && <ItemExplorerView />}
          {activeDatabase === 'mob' && metadataMap['mob']?.state === 'loaded' && <MobExplorerView />}
          {activeDatabase === 'skill' && metadataMap['skill']?.state === 'loaded' && <SkillExplorerView />}
          {activeDatabase === 'combo' && metadataMap['combo']?.state === 'loaded' && <ComboExplorerView />}
          {activeDatabase === 'group' && metadataMap['group']?.state === 'loaded' && <ItemGroupExplorerView />}
          {activeDatabase === 'package' && metadataMap['package']?.state === 'loaded' && <ItemPackageExplorerView />}
          {activeDatabase === 'randomopt' && metadataMap['randomopt']?.state === 'loaded' && <RandomOptionExplorerView />}

          {activeDatabase && metadataMap[activeDatabase]?.state !== 'loaded' && (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="text-muted-foreground text-sm">
                {AVAILABLE_DATABASES.find((d) => d.id === activeDatabase)?.name} is not loaded.
              </div>
              <button
                onClick={() => loadDatabase(activeDatabase, activeWorkspace.rootPath)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 py-2 rounded-lg font-medium shadow-xs"
              >
                <Play className="w-4 h-4" /> Load Database
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-background overflow-auto">
      <Card className="max-w-xl w-full bg-card border-border/80 shadow-md rounded-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3.5 bg-primary/10 border border-primary/20 rounded-2xl mb-2 w-fit">
            <Database className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">Database Explorer</CardTitle>
          <CardDescription className="text-xs text-muted-foreground truncate max-w-md mx-auto" title={activeWorkspace.rootPath}>
            Workspace: {activeWorkspace.rootPath}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Target Variant Selector */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/60 text-xs">
            <div>
              <div className="font-medium text-foreground">Target Variant</div>
              <div className="text-xs text-muted-foreground">Selecione o modo de compatibilidade do servidor</div>
            </div>
            <div className="flex bg-secondary p-1 rounded-lg border border-border/60">
              <button
                type="button"
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeVariant === 'RE'
                    ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setVariant('RE')}
                disabled={isBulkLoading}
              >
                Renewal
              </button>
              <button
                type="button"
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeVariant === 'PRE_RE'
                    ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setVariant('PRE_RE')}
                disabled={isBulkLoading}
              >
                Pre-Renewal
              </button>
            </div>
          </div>

          {/* Included Databases Overview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Bancos de Dados para Carregamento</span>
              <span className="text-xs text-muted-foreground font-mono">
                {loadedCount} de {totalDatabases} prontos
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {AVAILABLE_DATABASES.map((db) => {
                const meta = metadataMap[db.id];
                const IconComponent = db.icon;
                const isLoaded = meta?.state === 'loaded';
                const isLoading = meta?.state === 'loading';
                const isError = meta?.state === 'error';

                return (
                  <div
                    key={db.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isLoading
                        ? 'bg-primary/10 border-primary/30'
                        : isLoaded
                        ? 'bg-card border-border/80 shadow-2xs'
                        : 'bg-secondary/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-secondary border border-border/60 shrink-0">
                        <IconComponent className={`w-4 h-4 ${db.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{db.name}</div>
                        <div className="text-xs text-muted-foreground truncate font-mono">{db.description}</div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isLoaded && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{meta.entityCount} registros</span>
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-mono">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Carregando...</span>
                        </div>
                      )}
                      {isError && (
                        <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-mono">
                          <AlertCircle className="w-4 h-4" />
                          <span>Falha</span>
                        </div>
                      )}
                      {!isLoaded && !isLoading && !isError && (
                        <span className="text-xs text-muted-foreground font-mono">Pendente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar & Status Text (Visible when loading) */}
          {isBulkLoading && (
            <div className="space-y-2 p-3.5 rounded-xl bg-secondary/40 border border-border/60">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {currentLoadingStep || 'Processando arquivos...'}
                </span>
                <span className="text-muted-foreground font-medium">{loadingProgressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
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
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-sm py-3 rounded-xl shadow-xs transition-all"
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
