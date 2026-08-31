import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useItemPackageEditStore } from '@/stores/itemPackageEditStore';
import { EffectiveItemPackage } from '@/domain/database/itemPackage/effectiveItemPackage';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { ItemPackageDatabaseValidator } from '@/services/database/itemPackage/itemPackageDatabaseValidator';
import { ItemPackageDatabaseSerializer } from '@/services/database/itemPackage/itemPackageDatabaseSerializer';
import { ItemPackageEditTransactionService } from '@/services/database/itemPackageEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Undo2, Redo2, Package, Plus, Trash2, FileCode } from 'lucide-react';
import { LayeredItemPackageRepository } from '@/services/database/itemPackage/layeredItemPackageRepository';
import { ItemPackageDatabaseProvider } from '@/services/database/providers/itemPackageDatabaseProvider';
import { Input } from '@/components/ui/input';
import { openEntityInYamlEditor } from '@/stores/yamlEditorStore';

type InspectorTab = 'random_options' | 'groups' | 'layers';

export function ItemPackageInspector({ packageName }: { packageName: string }) {
  const [currentTab, setCurrentTab] = useState<InspectorTab>('random_options');
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('package'));

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
  } = useItemPackageEditStore();

  const pkg: EffectiveItemPackage | undefined = useMemo(() => {
    if (!provider || !packageName) return undefined;
    const repository = provider.getRepository() as LayeredItemPackageRepository | undefined;
    if (!repository || typeof repository.findByPackage !== 'function') return undefined;
    return repository.findByPackage(packageName);
  }, [provider, packageName]);

  useEffect(() => {
    if (pkg) {
      startSession(pkg);
    } else {
      cancelSession();
    }
  }, [pkg, startSession, cancelSession]);

  useEffect(() => {
    if (!currentSession) return;
    const validator = new ItemPackageDatabaseValidator();
    const service = new ItemPackageEditTransactionService(validator, new ItemPackageDatabaseSerializer(), {
      writeFile: async () => {},
    });
    const issues = service.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, setValidationIssues]);

  if (!pkg || !currentSession) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Package not found
      </div>
    );
  }

  const { layerProvenance } = pkg;
  const effectiveFields = currentSession.getEffectiveFields();
  const pendingChanges = currentSession.getPendingChanges();

  const handleSave = async () => {
    if (!activeWorkspace || !provider) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const validator = new ItemPackageDatabaseValidator();
      const serializer = new ItemPackageDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemPackageEditTransactionService(validator, serializer, writer);

      await service.commitSession(currentSession, provider as unknown as ItemPackageDatabaseProvider);

      const repo = provider.getRepository() as LayeredItemPackageRepository | undefined;
      const updated = repo?.findByPackage(packageName);
      if (updated) {
        startSession(updated);
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

  const handleAddRandomOptionItem = () => {
    const prev = effectiveFields.RandomOptions || { Count: 1, List: [] };
    const nextList = [...prev.List, { Item: 'Red_Potion', Rate: 10000 }];
    setField('RandomOptions', { ...prev, List: nextList });
  };

  const handleRemoveRandomOptionItem = (idx: number) => {
    if (!effectiveFields.RandomOptions) return;
    const nextList = effectiveFields.RandomOptions.List.filter((_, i) => i !== idx);
    setField('RandomOptions', { ...effectiveFields.RandomOptions, List: nextList });
  };

  return (
    <div
      className="flex flex-col h-full bg-[#141416] outline-none select-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
              {pkg.package}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">Item Package Bundle</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const primaryPath = layerProvenance[0] || 'item_package_db.yml';
                openEntityInYamlEditor(primaryPath, pkg.package, layerProvenance[0]);
              }}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-300 hover:text-sky-300 border border-[#27272a] hover:border-sky-500/40 flex items-center gap-1 transition-colors"
              title="Open in YAML Monaco Editor"
            >
              <FileCode className="w-3 h-3 text-sky-400" />
              <span>YAML</span>
            </button>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-purple-400 border border-[#27272a] flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>PACKAGE</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('random_options')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'random_options'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Random Options
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('groups')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'groups'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Fixed Groups ({effectiveFields.Groups?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('layers')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'layers'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Layers
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {currentSession.isDirty && (
          <SemanticDiffViewer
            original={pkg.fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Package Changes"
          />
        )}

        {commitError && (
          <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400 break-all">
            {commitError}
          </div>
        )}

        {currentTab === 'random_options' && (
          <div className="space-y-3 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Random Options Roll List
              </h3>
              <button
                type="button"
                onClick={handleAddRandomOptionItem}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-neutral-400">Roll Count:</label>
              <Input
                type="number"
                value={effectiveFields.RandomOptions?.Count || 1}
                onChange={(e) =>
                  setField('RandomOptions', {
                    Count: Number(e.target.value),
                    List: effectiveFields.RandomOptions?.List || [],
                  })
                }
                className="h-7 w-20 bg-[#141416] border-[#27272a] text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              {(effectiveFields.RandomOptions?.List || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#141416] border border-[#27272a]">
                  <span className="text-[11px] font-mono text-neutral-500 w-4">{idx + 1}.</span>
                  <Input
                    value={String(item.Item)}
                    onChange={(e) => {
                      const next = [...(effectiveFields.RandomOptions?.List || [])];
                      next[idx] = { ...next[idx], Item: e.target.value };
                      setField('RandomOptions', { ...effectiveFields.RandomOptions!, List: next });
                    }}
                    placeholder="Item AegisName"
                    className="h-7 bg-[#1f1f23] border-[#27272a] text-xs font-mono flex-1"
                  />
                  <Input
                    type="number"
                    value={item.Rate}
                    onChange={(e) => {
                      const next = [...(effectiveFields.RandomOptions?.List || [])];
                      next[idx] = { ...next[idx], Rate: Number(e.target.value) };
                      setField('RandomOptions', { ...effectiveFields.RandomOptions!, List: next });
                    }}
                    placeholder="Rate"
                    className="h-7 w-24 bg-[#1f1f23] border-[#27272a] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRandomOptionItem(idx)}
                    className="p-1 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'groups' && (
          <div className="space-y-3 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Package Fixed Groups
            </h3>
            {(!effectiveFields.Groups || effectiveFields.Groups.length === 0) ? (
              <div className="text-xs text-neutral-500 italic">No fixed groups configured for this package.</div>
            ) : (
              <div className="space-y-3">
                {effectiveFields.Groups.map((grp, gIdx) => (
                  <div key={gIdx} className="p-3 rounded bg-[#141416] border border-[#27272a] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">Group Slot #{grp.Group ?? (gIdx + 1)} {grp.Count ? `(Count: ${grp.Count})` : ''}</span>
                    </div>
                    <div className="space-y-1.5">
                      {(grp.Items || grp.List || []).map((entry, eIdx) => (
                        <div key={eIdx} className="flex items-center justify-between text-xs font-mono text-neutral-300">
                          <span>{entry.Item}</span>
                          <span className="text-neutral-500">
                            {entry.Rate !== undefined ? `Rate: ${entry.Rate / 100}% ` : ''}
                            {entry.Refine ? `+${entry.Refine} ` : ''}
                            {entry.Amount ? `(x${entry.Amount})` : ''}
                            {entry.RentalHours ? `[${entry.RentalHours}h]` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'layers' && (
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Layer Hierarchy
            </h3>
            {layerProvenance.map((layerId, idx) => (
              <div
                key={layerId}
                className="p-3 rounded border border-[#27272a] bg-[#1f1f23] flex items-center justify-between text-xs font-mono"
              >
                <span>{layerId}</span>
                <span className="text-[10px] text-neutral-400">Order: {idx + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-[#27272a] bg-[#1f1f23] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`p-1.5 rounded ${
              currentSession.canUndo ? 'text-neutral-300 hover:bg-[#27272a]' : 'text-neutral-600 cursor-not-allowed'
            }`}
            onClick={undo}
            disabled={!currentSession.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-1.5 rounded ${
              currentSession.canRedo ? 'text-neutral-300 hover:bg-[#27272a]' : 'text-neutral-600 cursor-not-allowed'
            }`}
            onClick={redo}
            disabled={!currentSession.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            onClick={() => {
              cancelSession();
              startSession(pkg);
            }}
            disabled={!currentSession.isDirty || isCommitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 ${
              currentSession.isDirty && validationIssues.length === 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
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
