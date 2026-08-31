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

  const option: EffectiveRandomOption | undefined = useMemo(() => {
    if (!repo || !optionId) return undefined;
    return repo.findOptionById(optionId);
  }, [repo, optionId]);

  const group: EffectiveRandomOptionGroup | undefined = useMemo(() => {
    if (!repo || !groupId) return undefined;
    return repo.findGroupById(groupId);
  }, [repo, groupId]);

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

  const [optionTab, setOptionTab] = useState<'general' | 'layers'>('general');
  const [groupTab, setGroupTab] = useState<'slots' | 'layers'>('slots');

  if (currentOptionSession && option) {
    const effectiveFields = currentOptionSession.getEffectiveFields();
    return (
      <div className="flex flex-col h-full bg-[#141416] select-none">
        <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
                {option.option}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Random Option #{option.id}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const primaryPath = option.layerProvenance[0] || 'item_randomopt_db.yml';
                  openEntityInYamlEditor(primaryPath, option.option, option.layerProvenance[0]);
                }}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-300 hover:text-sky-300 border border-[#27272a] hover:border-sky-500/40 flex items-center gap-1 transition-colors"
                title="Open in YAML Editor"
              >
                <FileCode className="w-3 h-3 text-sky-400" />
                <span>YAML</span>
              </button>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-sky-400 border border-[#27272a] flex items-center gap-1">
                <Dices className="w-3 h-3" />
                <span>OPTION</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
            <button
              type="button"
              onClick={() => setOptionTab('general')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                optionTab === 'general'
                  ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Option Identity & Script
            </button>
            <button
              type="button"
              onClick={() => setOptionTab('layers')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                optionTab === 'layers'
                  ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
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
            <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400">
              {commitError}
            </div>
          )}

          {optionTab === 'general' && (
            <div className="space-y-3 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Option Constant Name</label>
                <Input
                  value={effectiveFields.Option || ''}
                  onChange={(e) => setOptionField('Option', e.target.value)}
                  className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Script</label>
                <div className="border border-[#27272a] rounded overflow-hidden">
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
                  <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Layer Hierarchy & File Provenance
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
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
                        className={`p-3 rounded border transition-colors ${
                          isFinalLayer
                            ? 'bg-sky-950/20 border-sky-500/30'
                            : 'bg-[#1f1f23] border-[#27272a]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-medium ${
                                isFinalLayer
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-[#27272a] text-neutral-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-neutral-100">
                                {relativePath}
                              </div>
                              <div className="text-[11px] text-neutral-400">{layerName}</div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
                              relativePath.includes('import')
                                ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                : isBaseLayer
                                ? 'bg-[#141416] text-neutral-400 border-[#27272a]'
                                : 'bg-sky-950/60 text-sky-300 border-sky-500/30'
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
                          <div className="mt-2.5 pt-2 border-t border-[#27272a]/60">
                            <div className="text-[10px] text-neutral-500 mb-1">
                              Active fields from this file ({contributingFields.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {contributingFields.map((f) => (
                                <span
                                  key={f}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141416] text-neutral-300 border border-[#27272a]"
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

        <div className="p-3 border-t border-[#27272a] bg-[#1f1f23] flex items-center justify-end gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 ${
              currentOptionSession.isDirty && validationIssues.length === 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
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
      <div className="flex flex-col h-full bg-[#141416] select-none">
        <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
                {group.group}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
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
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-300 hover:text-sky-300 border border-[#27272a] hover:border-sky-500/40 flex items-center gap-1 transition-colors"
                title="Open in YAML Editor"
              >
                <FileCode className="w-3 h-3 text-sky-400" />
                <span>YAML</span>
              </button>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-amber-400 border border-[#27272a] flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>GROUP</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
            <button
              type="button"
              onClick={() => setGroupTab('slots')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                groupTab === 'slots'
                  ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Slots ({effectiveFields.Slots.length})
            </button>
            <button
              type="button"
              onClick={() => setGroupTab('layers')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                groupTab === 'layers'
                  ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Layers
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {groupTab === 'slots' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Configured Slots
              </h3>
              {effectiveFields.Slots.map((slot, sIdx) => (
                <div key={sIdx} className="p-3 rounded bg-[#1f1f23] border border-[#27272a] space-y-2 text-xs">
                  <div className="font-semibold text-neutral-300">Slot #{slot.Slot} ({slot.Options.length} Options)</div>
                  <div className="space-y-1.5">
                    {slot.Options.map((opt, oIdx) => (
                      <div key={oIdx} className="p-2 rounded bg-[#141416] border border-[#27272a] text-[11px] font-mono">
                        <div className="text-sky-300 font-medium">{opt.Option}</div>
                        <div className="text-neutral-500 mt-0.5">
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
                  <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Layer Hierarchy & File Provenance
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
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
                        className={`p-3 rounded border transition-colors ${
                          isFinalLayer
                            ? 'bg-sky-950/20 border-sky-500/30'
                            : 'bg-[#1f1f23] border-[#27272a]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-medium ${
                                isFinalLayer
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-[#27272a] text-neutral-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-neutral-100">
                                {relativePath}
                              </div>
                              <div className="text-[11px] text-neutral-400">{layerName}</div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
                              relativePath.includes('import')
                                ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                : isBaseLayer
                                ? 'bg-[#141416] text-neutral-400 border-[#27272a]'
                                : 'bg-sky-950/60 text-sky-300 border-sky-500/30'
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
                          <div className="mt-2.5 pt-2 border-t border-[#27272a]/60">
                            <div className="text-[10px] text-neutral-500 mb-1">
                              Active fields from this file ({contributingFields.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {contributingFields.map((f) => (
                                <span
                                  key={f}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141416] text-neutral-300 border border-[#27272a]"
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
