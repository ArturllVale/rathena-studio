import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useComboEditStore } from '@/stores/comboEditStore';
import { EffectiveItemCombo } from '@/domain/database/combo/effectiveCombo';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { ComboDatabaseValidator } from '@/services/database/combo/comboDatabaseValidator';
import { ComboDatabaseSerializer } from '@/services/database/combo/comboDatabaseSerializer';
import { ComboEditTransactionService } from '@/services/database/comboEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { ComboDatabaseProvider } from '@/services/database/providers/comboDatabaseProvider';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Undo2, Redo2, Sparkles, Plus, Trash2, FileCode } from 'lucide-react';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { Input } from '@/components/ui/input';
import { MonacoScriptEditor } from '@/features/editor/monaco/MonacoScriptEditor';
import { openEntityInYamlEditor } from '@/stores/yamlEditorStore';

type InspectorTab = 'general' | 'script' | 'layers';

export function ComboInspector({ comboKey }: { comboKey: string }) {
  const [currentTab, setCurrentTab] = useState<InspectorTab>('general');
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('combo'));

  const {
    currentSession,
    startSession,
    cancelSession,
    undo,
    redo,
    setField,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useComboEditStore();

  const comboMeta = useDatabaseStore((s) => s.metadataMap['combo']);

  const combo: EffectiveItemCombo | undefined = useMemo(() => {
    if (!provider || !comboKey) return undefined;
    const repository = provider.getRepository() as LayeredComboRepository | undefined;
    if (!repository || typeof repository.findByKey !== 'function') return undefined;
    return repository.findByKey(comboKey);
  }, [provider, comboKey, comboMeta]);

  useEffect(() => {
    if (combo) {
      startSession(combo);
    } else {
      cancelSession();
    }
  }, [combo, startSession, cancelSession]);

  useEffect(() => {
    if (!currentSession) return;
    const validator = new ComboDatabaseValidator();
    const service = new ComboEditTransactionService(validator, new ComboDatabaseSerializer(), {
      writeFile: async () => {},
    });
    const issues = service.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, setValidationIssues]);

  if (!combo || !currentSession) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Combo not found
      </div>
    );
  }

  const { layerProvenance } = combo;
  const effectiveFields = currentSession.getEffectiveFields();
  const pendingChanges = currentSession.getPendingChanges();

  const handleSave = async () => {
    if (!activeWorkspace || !provider) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const validator = new ComboDatabaseValidator();
      const serializer = new ComboDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ComboEditTransactionService(validator, serializer, writer);

      await service.commitSession(currentSession, provider as unknown as ComboDatabaseProvider);

      useDatabaseStore.getState().refreshMetadata();

      const repo = provider.getRepository() as LayeredComboRepository | undefined;
      const updatedCombo = repo?.findByKey(comboKey);
      if (updatedCombo) {
        startSession(updatedCombo);
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

  const handleItemChange = (idx: number, value: string) => {
    const list = [...(effectiveFields.Combo || [])];
    list[idx] = value;
    setField('Combo', list);
  };

  const handleAddItem = () => {
    const list = [...(effectiveFields.Combo || []), ''];
    setField('Combo', list);
  };

  const handleRemoveItem = (idx: number) => {
    if ((effectiveFields.Combo || []).length <= 2) return;
    const list = (effectiveFields.Combo || []).filter((_, i) => i !== idx);
    setField('Combo', list);
  };

  return (
    <div
      className="flex flex-col h-full bg-card outline-none select-none text-foreground"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/80 bg-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-foreground font-mono leading-tight">
              {combo.fields.Combo.join(' + ')}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{combo.fields.Combo.length} Items in Combo</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const primaryPath = layerProvenance[0] || 'item_combo_db.yml';
                openEntityInYamlEditor(primaryPath, combo.fields.Combo[0] || '', layerProvenance[0]);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-background text-foreground hover:border-pastel-blue/60 border border-border/80 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Open in YAML Editor"
            >
              <FileCode className="w-3.5 h-3.5 text-pastel-blue" />
              <span>YAML</span>
            </button>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-pastel-amber/15 text-pastel-amber border border-pastel-amber/30 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>COMBO</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-3.5 border-t border-border/60 pt-3">
          {(['general', 'script', 'layers'] as const).map((tab) => {
            const active = currentTab === tab;
            const labels = { general: 'Combo Items', script: 'Script', layers: 'Layers' };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCurrentTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-pastel-blue text-pastel-blue-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {currentSession.isDirty && (
          <SemanticDiffViewer
            original={combo.fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Combo Changes"
          />
        )}

        {commitError && (
          <div className="bg-destructive/10 p-3.5 rounded-xl border border-destructive/30 text-xs text-destructive break-all">
            {commitError}
          </div>
        )}

        {currentTab === 'general' && (
          <div className="space-y-3.5 bg-muted/20 p-4 rounded-xl border border-border/80 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Combo Items List
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs text-pastel-blue hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(effectiveFields.Combo || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-muted-foreground w-5 text-right">{idx + 1}.</span>
                  <Input
                    value={String(item)}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    className="h-9 bg-background border-border/80 text-xs font-mono"
                  />
                  {(effectiveFields.Combo || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'script' && (
          <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/80 shadow-xs">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Combo Bonus Script
            </h3>
            <div className="rounded-xl overflow-hidden">
              <MonacoScriptEditor
                value={effectiveFields.Script || ''}
                onChange={(val) => setField('Script', val)}
                height="220px"
              />
            </div>
          </div>
        )}

        {currentTab === 'layers' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Layer Hierarchy &amp; File Provenance
                </h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {layerProvenance.length} layer{layerProvenance.length > 1 ? 's' : ''} loaded
                </span>
              </div>

              <div className="space-y-3">
                {layerProvenance.map((layerId, idx) => {
                  const repository = provider ? (provider.getRepository() as LayeredComboRepository | undefined) : undefined;
                  const layerData = repository?.getLayer ? repository.getLayer(layerId) : undefined;
                  const relativePath =
                    layerData?.layer.relativePath ||
                    Object.values(combo.fieldOrigins).find((o) => o.layerId === layerId)?.filePath ||
                    layerId;
                  const layerName = layerData?.layer.name || layerId;
                  const isFinalLayer = idx === layerProvenance.length - 1;
                  const isBaseLayer = idx === 0;

                  const contributingFields = Object.entries(combo.fieldOrigins)
                    .filter(([_, origin]) => origin.layerId === layerId)
                    .map(([fieldName]) => fieldName);

                  return (
                    <div
                      key={layerId}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        isFinalLayer
                          ? 'bg-pastel-blue/10 border-pastel-blue/40 shadow-xs'
                          : 'bg-background border-border/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-medium ${
                              isFinalLayer
                                ? 'bg-pastel-blue text-pastel-blue-foreground font-semibold shadow-xs'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-mono font-semibold text-foreground">
                              {relativePath}
                            </div>
                            <div className="text-xs text-muted-foreground">{layerName}</div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                            relativePath.includes('import')
                              ? 'bg-lavender/15 text-lavender border-lavender/30 font-semibold'
                              : isBaseLayer
                              ? 'bg-secondary text-secondary-foreground border-border/80'
                              : 'bg-pastel-blue/15 text-pastel-blue border-pastel-blue/30 font-semibold'
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
                        <div className="mt-3 pt-2.5 border-t border-border/60">
                          <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">
                            Active fields from this file ({contributingFields.length}):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {contributingFields.map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-secondary text-secondary-foreground border border-border/80"
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
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3.5 border-t border-border/80 bg-card flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              currentSession.canUndo ? 'text-foreground hover:bg-secondary' : 'text-muted-foreground/40 cursor-not-allowed'
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
              currentSession.canRedo ? 'text-foreground hover:bg-secondary' : 'text-muted-foreground/40 cursor-not-allowed'
            }`}
            onClick={redo}
            disabled={!currentSession.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              cancelSession();
              startSession(combo);
            }}
            disabled={!currentSession.isDirty || isCommitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs rounded-xl font-semibold flex items-center gap-2 transition-all ${
              currentSession.isDirty && validationIssues.length === 0
                ? 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
            onClick={handleSave}
            disabled={!currentSession.isDirty || validationIssues.length > 0 || isCommitting}
          >
            {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
