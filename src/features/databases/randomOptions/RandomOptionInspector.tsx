import { useMemo, useEffect, useState } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useRandomOptEditStore } from '@/stores/randomOptEditStore';
import { EffectiveRandomOption, EffectiveRandomOptionGroup } from '@/domain/database/randomOpt/effectiveRandomOpt';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { RandomOptDatabaseValidator } from '@/services/database/randomOpt/randomOptDatabaseValidator';
import { RandomOptDatabaseSerializer } from '@/services/database/randomOpt/randomOptDatabaseSerializer';
import { RandomOptEditTransactionService } from '@/services/database/randomOptEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Dices, Layers, FileCode } from 'lucide-react';
import { LayeredRandomOptRepository } from '@/services/database/randomOpt/layeredRandomOptRepository';
import { RandomOptDatabaseProvider } from '@/services/database/providers/randomOptDatabaseProvider';
import { Input } from '@/components/ui/input';
import { MonacoScriptEditor } from '@/features/editor/monaco/MonacoScriptEditor';
import { openEntityInYamlEditor } from '@/stores/yamlEditorStore';

export function RandomOptionInspector({
  optionId,
  groupId,
}: {
  optionId?: number | null;
  groupId?: number | null;
}) {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('randomopt'));

  const {
    currentOptionSession,
    currentGroupSession,
    startOptionSession,
    startGroupSession,
    cancelSession,
    setOptionField,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useRandomOptEditStore();

  const repo = useMemo(() => {
    if (!provider) return undefined;
    return provider.getRepository() as LayeredRandomOptRepository | undefined;
  }, [provider]);

  const optMeta = useDatabaseStore((s) => s.metadataMap['randomOption']);

  const option: EffectiveRandomOption | undefined = useMemo(() => {
    if (!repo || !optionId) return undefined;
    return repo.findOptionById(optionId);
  }, [repo, optionId, optMeta]);

  const group: EffectiveRandomOptionGroup | undefined = useMemo(() => {
    if (!repo || !groupId) return undefined;
    return repo.findGroupById(groupId);
  }, [repo, groupId, optMeta]);

  useEffect(() => {
    if (optionId && option) {
      startOptionSession(option);
    } else if (groupId && group) {
      startGroupSession(group);
    } else {
      cancelSession();
    }
  }, [optionId, groupId, option, group, startOptionSession, startGroupSession, cancelSession]);

  useEffect(() => {
    const validator = new RandomOptDatabaseValidator();
    const service = new RandomOptEditTransactionService(validator, new RandomOptDatabaseSerializer(), {
      writeFile: async () => {},
    });

    if (currentOptionSession) {
      const issues = service.validateOptionSession(currentOptionSession);
      setValidationIssues(issues);
    } else if (currentGroupSession) {
      const issues = service.validateGroupSession(currentGroupSession);
      setValidationIssues(issues);
    }
  }, [currentOptionSession, currentGroupSession, setValidationIssues]);

  const [optionTab, setOptionTab] = useState<'general' | 'layers'>('general');
  const [groupTab, setGroupTab] = useState<'slots' | 'layers'>('slots');

  if ((!option && !group) || (!currentOptionSession && !currentGroupSession)) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Select a random option or group to view details
      </div>
    );
  }

  const handleSaveOption = async () => {
    if (!activeWorkspace || !provider || !currentOptionSession) return;
    setIsCommitting(true);
    setCommitError(null);
    try {
      const validator = new RandomOptDatabaseValidator();
      const serializer = new RandomOptDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new RandomOptEditTransactionService(validator, serializer, writer);

      await service.commitOptionSession(currentOptionSession, provider as unknown as RandomOptDatabaseProvider);

      useDatabaseStore.getState().refreshMetadata();

      if (optionId && repo) {
        const updated = repo.findOptionById(optionId);
        if (updated) startOptionSession(updated);
      }
    } catch (e) {
      setCommitError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCommitting(false);
    }
  };

  if (currentOptionSession && option) {
    const effectiveFields = currentOptionSession.getEffectiveFields();
    return (
      <div className="flex flex-col h-full bg-card/60 select-none">
        <div className="p-4 border-b border-border/80 bg-card/90 backdrop-blur-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-foreground font-mono leading-tight">
                {option.option}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Random Option #{option.id}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const primaryPath = option.layerProvenance[0] || 'item_randomopt_db.yml';
                  openEntityInYamlEditor(primaryPath, option.option, option.layerProvenance[0]);
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-background text-muted-foreground hover:text-pastel-blue border border-border/80 hover:border-pastel-blue/40 flex items-center gap-1.5 transition-colors"
                title="Open in YAML Editor"
              >
                <FileCode className="w-3.5 h-3.5 text-pastel-blue" />
                <span>YAML</span>
              </button>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-pastel-blue/15 text-pastel-blue border border-pastel-blue/30 flex items-center gap-1.5 font-semibold">
                <Dices className="w-3.5 h-3.5" />
                <span>OPTION</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3.5 border-t border-border/60 pt-2.5">
            <button
              type="button"
              onClick={() => setOptionTab('general')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                optionTab === 'general'
                  ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Option Identity & Script
            </button>
            <button
              type="button"
              onClick={() => setOptionTab('layers')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                optionTab === 'layers'
                  ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Layers
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {currentOptionSession.isDirty && (
            <SemanticDiffViewer
              original={option.fields as Record<string, unknown>}
              pending={currentOptionSession.getPendingChanges() as Record<string, unknown>}
              title="Unsaved Option Changes"
            />
          )}

          {commitError && (
            <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-xs text-destructive">
              {commitError}
            </div>
          )}

          {optionTab === 'general' && (
            <div className="space-y-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1 font-medium">Option Constant Name</label>
                <Input
                  value={effectiveFields.Option || ''}
                  onChange={(e) => setOptionField('Option', e.target.value)}
                  className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-lg"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1 font-medium">Script</label>
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <MonacoScriptEditor
                    value={effectiveFields.Script || ''}
                    onChange={(val) => setOptionField('Script', val)}
                    height="160px"
                  />
                </div>
              </div>
            </div>
          )}

          {optionTab === 'layers' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Layer Hierarchy & File Provenance
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {option.layerProvenance.length} layer{option.layerProvenance.length > 1 ? 's' : ''} loaded
                  </span>
                </div>

                <div className="space-y-2.5">
                  {option.layerProvenance.map((layerId, idx) => {
                    const layerData = repo?.getOptionLayer ? repo.getOptionLayer(layerId) : undefined;
                    const relativePath =
                      layerData?.layer.relativePath ||
                      Object.values(option.fieldOrigins).find((o) => o.layerId === layerId)?.filePath ||
                      layerId;
                    const layerName = layerData?.layer.name || layerId;
                    const isFinalLayer = idx === option.layerProvenance.length - 1;
                    const isBaseLayer = idx === 0;

                    const contributingFields = Object.entries(option.fieldOrigins)
                      .filter(([_, origin]) => origin.layerId === layerId)
                      .map(([fieldName]) => fieldName);

                    return (
                      <div
                        key={layerId}
                        className={`p-3.5 rounded-xl border transition-colors shadow-xs ${
                          isFinalLayer
                            ? 'bg-pastel-blue/5 border-pastel-blue/40'
                            : 'bg-card border-border/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium ${
                                isFinalLayer
                                  ? 'bg-pastel-blue text-background font-bold'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-foreground">
                                {relativePath}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{layerName}</div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap ${
                              relativePath.includes('import')
                                ? 'bg-pastel-lavender/15 text-pastel-lavender border-pastel-lavender/30'
                                : isBaseLayer
                                ? 'bg-muted/60 text-muted-foreground border-border/70'
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
                          <div className="mt-2.5 pt-2 border-t border-border/60">
                            <div className="text-[10px] text-muted-foreground mb-1.5">
                              Active fields from this file ({contributingFields.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {contributingFields.map((f) => (
                                <span
                                  key={f}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-background text-foreground border border-border/80"
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

        <div className="p-3.5 border-t border-border/80 bg-card/90 backdrop-blur-xs flex items-center justify-end gap-2">
          <button
            type="button"
            className={`px-4 py-2 text-xs rounded-xl font-medium flex items-center gap-1.5 transition-colors ${
              currentOptionSession.isDirty && validationIssues.length === 0
                ? 'bg-pastel-blue/20 text-pastel-blue hover:bg-pastel-blue/30 border border-pastel-blue/30 shadow-sm'
                : 'bg-muted/40 text-muted-foreground/50 border border-border/50 cursor-not-allowed'
            }`}
            onClick={handleSaveOption}
            disabled={!currentOptionSession.isDirty || validationIssues.length > 0 || isCommitting}
          >
            {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  if (currentGroupSession && group) {
    const effectiveFields = currentGroupSession.getEffectiveFields();
    return (
      <div className="flex flex-col h-full bg-card/60 select-none">
        <div className="p-4 border-b border-border/80 bg-card/90 backdrop-blur-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-foreground font-mono leading-tight">
                {group.group}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Group #{group.id} • {effectiveFields.Slots.length} Slots
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const primaryPath = group.layerProvenance[0] || 'item_randomopt_group.yml';
                  openEntityInYamlEditor(primaryPath, group.group, group.layerProvenance[0]);
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-background text-muted-foreground hover:text-pastel-blue border border-border/80 hover:border-pastel-blue/40 flex items-center gap-1.5 transition-colors"
                title="Open in YAML Editor"
              >
                <FileCode className="w-3.5 h-3.5 text-pastel-blue" />
                <span>YAML</span>
              </button>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-pastel-amber/15 text-pastel-amber border border-pastel-amber/30 flex items-center gap-1.5 font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>GROUP</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3.5 border-t border-border/60 pt-2.5">
            <button
              type="button"
              onClick={() => setGroupTab('slots')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                groupTab === 'slots'
                  ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Slots ({effectiveFields.Slots.length})
            </button>
            <button
              type="button"
              onClick={() => setGroupTab('layers')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                groupTab === 'layers'
                  ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Layers
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {groupTab === 'slots' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Configured Slots
              </h3>
              {effectiveFields.Slots.map((slot, sIdx) => (
                <div key={sIdx} className="p-4 rounded-xl bg-card border border-border/80 space-y-2.5 text-xs shadow-xs">
                  <div className="font-semibold text-foreground">Slot #{slot.Slot} ({slot.Options.length} Options)</div>
                  <div className="space-y-2">
                    {slot.Options.map((opt, oIdx) => (
                      <div key={oIdx} className="p-3 rounded-lg bg-background border border-border/80 text-[11px] font-mono shadow-xs">
                        <div className="text-pastel-blue font-semibold">{opt.Option}</div>
                        <div className="text-muted-foreground mt-0.5">
                          Range: {opt.MinValue} ~ {opt.MaxValue} • Chance: {opt.Chance / 100}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {groupTab === 'layers' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Layer Hierarchy & File Provenance
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {group.layerProvenance.length} layer{group.layerProvenance.length > 1 ? 's' : ''} loaded
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.layerProvenance.map((layerId, idx) => {
                    const layerData = repo?.getGroupLayer ? repo.getGroupLayer(layerId) : undefined;
                    const relativePath =
                      layerData?.layer.relativePath ||
                      Object.values(group.fieldOrigins).find((o) => o.layerId === layerId)?.filePath ||
                      layerId;
                    const layerName = layerData?.layer.name || layerId;
                    const isFinalLayer = idx === group.layerProvenance.length - 1;
                    const isBaseLayer = idx === 0;

                    const contributingFields = Object.entries(group.fieldOrigins)
                      .filter(([_, origin]) => origin.layerId === layerId)
                      .map(([fieldName]) => fieldName);

                    return (
                      <div
                        key={layerId}
                        className={`p-3.5 rounded-xl border transition-colors shadow-xs ${
                          isFinalLayer
                            ? 'bg-pastel-blue/5 border-pastel-blue/40'
                            : 'bg-card border-border/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium ${
                                isFinalLayer
                                  ? 'bg-pastel-blue text-background font-bold'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-foreground">
                                {relativePath}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{layerName}</div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap ${
                              relativePath.includes('import')
                                ? 'bg-pastel-lavender/15 text-pastel-lavender border-pastel-lavender/30'
                                : isBaseLayer
                                ? 'bg-muted/60 text-muted-foreground border-border/70'
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
                          <div className="mt-2.5 pt-2 border-t border-border/60">
                            <div className="text-[10px] text-muted-foreground mb-1.5">
                              Active fields from this file ({contributingFields.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {contributingFields.map((f) => (
                                <span
                                  key={f}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-background text-foreground border border-border/80"
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
      </div>
    );
  }

  return null;
}
