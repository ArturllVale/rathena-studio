import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useMobEditStore } from '@/stores/mobEditStore';
import { MobDatabaseValidator } from '@/services/database/mobDatabaseValidator';
import { MobDatabaseSerializer } from '@/services/database/mob/mobDatabaseSerializer';
import { MobEditTransactionService } from '@/services/database/mobEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Undo2, Redo2, Layers, Sliders, Shield, Sparkles, Gift, FileCode } from 'lucide-react';
import { MobIdentitySection } from './inspector/MobIdentitySection';
import { MobCombatSection } from './inspector/MobCombatSection';
import { MobAttributesSection } from './inspector/MobAttributesSection';
import { MobModesSection } from './inspector/MobModesSection';
import { MobDropsSection } from './inspector/MobDropsSection';
import { LayeredMobRepository } from '@/services/database/mob/layeredMobRepository';
import { MobDatabaseProvider } from '@/services/database/providers/mobDatabaseProvider';
import { MobFieldOrigin } from '@/domain/database/mob/effectiveMob';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { openEntityInYamlEditor } from '@/stores/yamlEditorStore';

type MobInspectorTab = 'general' | 'attributes' | 'modes' | 'drops' | 'provenance';

export function MobInspector({ mobId }: { mobId: number }) {
  const [currentTab, setCurrentTab] = useState<MobInspectorTab>('general');
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('mob'));

  const {
    currentSession,
    startSession,
    cancelSession,
    reset,
    undo,
    redo,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useMobEditStore();

  const mobMeta = useDatabaseStore((s) => s.metadataMap['mob']);

  const mob = useMemo(() => {
    if (!provider) return null;
    const repo = provider.getRepository() as LayeredMobRepository | undefined;
    return repo?.findById ? repo.findById(mobId) : null;
  }, [provider, mobId, mobMeta]);

  useEffect(() => {
    if (mob) {
      startSession(mob);
    } else {
      cancelSession();
    }
  }, [mob?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const transactionService = useMemo(() => {
    const validator = new MobDatabaseValidator();
    const serializer = new MobDatabaseSerializer();
    const writer = new TauriFileContentWriter(activeWorkspace?.rootPath || '');
    return new MobEditTransactionService(validator, serializer, writer);
  }, [activeWorkspace?.rootPath]);

  // Run validation on changes
  useEffect(() => {
    if (!currentSession) {
      setValidationIssues([]);
      return;
    }
    const issues = transactionService.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, transactionService, setValidationIssues]);

  if (!mob || !currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
        Select a monster to view and edit properties.
      </div>
    );
  }

  const pendingChanges = currentSession.getPendingChanges();
  const fields = mob.fields;
  const isDirty = currentSession.isDirty;
  const { layerProvenance } = mob;

  const handleCommit = async () => {
    if (!provider || !currentSession || isCommitting) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      await transactionService.commitSession(currentSession, provider as unknown as MobDatabaseProvider);

      useDatabaseStore.getState().refreshMetadata();

      const repo = provider.getRepository() as LayeredMobRepository | undefined;
      const updatedMob = repo?.findById(mobId);
      if (updatedMob) {
        startSession(updatedMob);
      }
    } catch (e) {
      setCommitError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCommitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    } else if (
      (e.ctrlKey && e.key.toLowerCase() === 'y') ||
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault();
      redo();
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-card outline-none select-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-5 border-b border-border/80 bg-card/80 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xl font-bold text-foreground leading-snug truncate">
              {fields.Name || 'Unknown Monster'}
            </div>
            <div className="text-xs font-mono text-pastel-blue mt-0.5 font-semibold tracking-wide">
              {fields.AegisName || 'Unknown'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const primaryPath = (Object.values(mob.fieldOrigins) as MobFieldOrigin[])[0]?.filePath || layerProvenance[0] || 'mob_db.yml';
                openEntityInYamlEditor(primaryPath, mob.id, layerProvenance[0]);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 hover:border-primary/40 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Open in YAML Editor"
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span>YAML</span>
            </button>
            {fields.Class && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-pastel-blue/15 text-pastel-blue border border-pastel-blue/30 font-semibold">
                {fields.Class}
              </span>
            )}
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground border border-border/60 font-semibold">
              #{mob.id}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setCurrentTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'general'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General &amp; Stats</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('attributes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'attributes'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Attributes &amp; Race</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('modes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'modes'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Modes</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('drops')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'drops'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Drops &amp; MVP</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('provenance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'provenance'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Semantic Diff Preview */}
        {isDirty && (
          <SemanticDiffViewer
            original={fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Monster Changes"
          />
        )}

        {currentTab === 'general' && (
          <div className="space-y-5">
            <MobIdentitySection mob={mob} />
            <MobCombatSection mob={mob} />
          </div>
        )}

        {currentTab === 'attributes' && <MobAttributesSection mob={mob} />}

        {currentTab === 'modes' && <MobModesSection mob={mob} />}

        {currentTab === 'drops' && <MobDropsSection mob={mob} />}

        {currentTab === 'provenance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Layer Hierarchy &amp; File Provenance
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {layerProvenance.length} layer{layerProvenance.length > 1 ? 's' : ''} loaded
              </span>
            </div>

            <div className="space-y-3">
              {layerProvenance.map((layerId: string, idx: number) => {
                const repository = provider ? (provider.getRepository() as LayeredMobRepository | undefined) : undefined;
                const layerData = repository?.getLayer ? repository.getLayer(layerId) : undefined;
                const relativePath =
                  layerData?.layer.relativePath ||
                  (Object.values(mob.fieldOrigins) as MobFieldOrigin[]).find((o: MobFieldOrigin) => o.layerId === layerId)?.filePath ||
                  layerId;
                const layerName = layerData?.layer.name || layerId;
                const isFinalLayer = idx === layerProvenance.length - 1;
                const isBaseLayer = idx === 0;

                const contributingFields = (Object.entries(mob.fieldOrigins) as [string, MobFieldOrigin][])
                  .filter(([_, origin]: [string, MobFieldOrigin]) => origin.layerId === layerId)
                  .map(([fieldName]) => fieldName);

                return (
                  <div
                    key={layerId}
                    className={`p-4 rounded-xl border transition-all ${
                      isFinalLayer
                        ? 'bg-primary/5 border-primary/30 shadow-2xs'
                        : 'bg-card border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            isFinalLayer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-mono font-semibold text-foreground">{relativePath}</div>
                          <div className="text-xs text-muted-foreground">{layerName}</div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-mono px-2.5 py-1 rounded-full border whitespace-nowrap font-medium ${
                          relativePath.includes('import')
                            ? 'bg-lavender/15 text-lavender border-lavender/30'
                            : isBaseLayer
                            ? 'bg-secondary text-muted-foreground border-border/60'
                            : 'bg-pastel-blue/15 text-pastel-blue border-pastel-blue/30'
                        }`}
                      >
                        {relativePath.includes('import')
                          ? 'Import Override'
                          : isBaseLayer
                          ? 'Base Layer'
                          : 'Mode Layer'}
                      </span>
                    </div>

                    {contributingFields.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <div className="text-xs text-muted-foreground mb-1.5 font-medium">
                          Active fields from this file ({contributingFields.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {contributingFields.map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded-md text-xs font-mono bg-secondary text-secondary-foreground border border-border/60"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-border/80 bg-card/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              currentSession.canUndo ? 'text-foreground hover:bg-accent/80' : 'text-muted-foreground/40 cursor-not-allowed'
            }`}
            onClick={undo}
            disabled={!currentSession.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              currentSession.canRedo ? 'text-foreground hover:bg-accent/80' : 'text-muted-foreground/40 cursor-not-allowed'
            }`}
            onClick={redo}
            disabled={!currentSession.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {commitError && <div className="text-xs text-destructive font-mono truncate max-w-xs">{commitError}</div>}
          <button
            type="button"
            disabled={!isDirty || isCommitting}
            onClick={reset}
            className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!isDirty || isCommitting || validationIssues.some((i) => i.severity === 'error')}
            onClick={handleCommit}
            className={`px-4 py-2 text-xs rounded-lg font-semibold flex items-center gap-2 transition-all shadow-xs ${
              isDirty && !validationIssues.some((i) => i.severity === 'error')
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save Monster'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
