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

  const pkgMeta = useDatabaseStore((s) => s.metadataMap['itemPackage']);

  const pkg: EffectiveItemPackage | undefined = useMemo(() => {
    if (!provider || !packageName) return undefined;
    const repository = provider.getRepository() as LayeredItemPackageRepository | undefined;
    if (!repository || typeof repository.findByPackage !== 'function') return undefined;
    return repository.findByPackage(packageName);
  }, [provider, packageName, pkgMeta]);

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

      useDatabaseStore.getState().refreshMetadata();

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
      className="flex flex-col h-full bg-card/60 outline-none select-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/80 bg-card/90 backdrop-blur-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-foreground font-mono leading-tight">
              {pkg.package}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Item Package Bundle</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const primaryPath = layerProvenance[0] || 'item_package_db.yml';
                openEntityInYamlEditor(primaryPath, pkg.package, layerProvenance[0]);
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-background text-muted-foreground hover:text-pastel-blue border border-border/80 hover:border-pastel-blue/40 flex items-center gap-1.5 transition-colors"
              title="Open in YAML Editor"
            >
              <FileCode className="w-3.5 h-3.5 text-pastel-blue" />
              <span>YAML</span>
            </button>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-pastel-lavender/15 text-pastel-lavender border border-pastel-lavender/30 flex items-center gap-1.5 font-semibold">
              <Package className="w-3.5 h-3.5" />
              <span>PACKAGE</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-3.5 border-t border-border/60 pt-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('random_options')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              currentTab === 'random_options'
                ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Random Options
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('groups')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              currentTab === 'groups'
                ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Fixed Groups ({effectiveFields.Groups?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('layers')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              currentTab === 'layers'
                ? 'bg-pastel-blue/20 text-pastel-blue font-semibold border border-pastel-blue/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
          <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-xs text-destructive break-all">
            {commitError}
          </div>
        )}

        {currentTab === 'random_options' && (
          <div className="space-y-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Random Options Roll List
              </h3>
              <button
                type="button"
                onClick={handleAddRandomOptionItem}
                className="flex items-center gap-1.5 text-xs text-pastel-blue font-medium bg-pastel-blue/15 hover:bg-pastel-blue/25 px-2.5 py-1.5 rounded-lg border border-pastel-blue/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-muted-foreground font-medium">Roll Count:</label>
              <Input
                type="number"
                value={effectiveFields.RandomOptions?.Count || 1}
                onChange={(e) =>
                  setField('RandomOptions', {
                    Count: Number(e.target.value),
                    List: effectiveFields.RandomOptions?.List || [],
                  })
                }
                className="h-8 w-24 bg-background border-border/80 text-xs font-mono text-foreground rounded-lg"
              />
            </div>

            <div className="space-y-2">
              {(effectiveFields.RandomOptions?.List || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/80 shadow-xs">
                  <span className="text-[11px] font-mono text-muted-foreground w-5">{idx + 1}.</span>
                  <Input
                    value={String(item.Item)}
                    onChange={(e) => {
                      const next = [...(effectiveFields.RandomOptions?.List || [])];
                      next[idx] = { ...next[idx], Item: e.target.value };
                      setField('RandomOptions', { ...effectiveFields.RandomOptions!, List: next });
                    }}
                    placeholder="Item AegisName"
                    className="h-8 bg-card border-border/80 text-xs font-mono text-foreground flex-1 rounded-lg"
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
                    className="h-8 w-28 bg-card border-border/80 text-xs font-mono text-foreground rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRandomOptionItem(idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'groups' && (
          <div className="space-y-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Package Fixed Groups
            </h3>
            {(!effectiveFields.Groups || effectiveFields.Groups.length === 0) ? (
              <div className="text-xs text-muted-foreground italic">No fixed groups configured for this package.</div>
            ) : (
              <div className="space-y-3">
                {effectiveFields.Groups.map((grp, gIdx) => (
                  <div key={gIdx} className="p-3.5 rounded-xl bg-background border border-border/80 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Group Slot #{grp.Group ?? (gIdx + 1)} {grp.Count ? `(Count: ${grp.Count})` : ''}</span>
                    </div>
                    <div className="space-y-1.5">
                      {(grp.Items || grp.List || []).map((entry, eIdx) => (
                        <div key={eIdx} className="flex items-center justify-between text-xs font-mono text-foreground p-1.5 rounded-md hover:bg-muted/40">
                          <span className="font-medium">{entry.Item}</span>
                          <span className="text-muted-foreground">
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
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Layer Hierarchy & File Provenance
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {layerProvenance.length} layer{layerProvenance.length > 1 ? 's' : ''} loaded
                </span>
              </div>

              <div className="space-y-2.5">
                {layerProvenance.map((layerId, idx) => {
                  const repository = provider ? (provider.getRepository() as LayeredItemPackageRepository | undefined) : undefined;
                  const layerData = repository?.getLayer ? repository.getLayer(layerId) : undefined;
                  const relativePath =
                    layerData?.layer.relativePath ||
                    Object.values(pkg.fieldOrigins).find((o) => o.layerId === layerId)?.filePath ||
                    layerId;
                  const layerName = layerData?.layer.name || layerId;
                  const isFinalLayer = idx === layerProvenance.length - 1;
                  const isBaseLayer = idx === 0;

                  const contributingFields = Object.entries(pkg.fieldOrigins)
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

      {/* Footer Controls */}
      <div className="p-3.5 border-t border-border/80 bg-card/90 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              currentSession.canUndo ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40 cursor-not-allowed'
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
              currentSession.canRedo ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40 cursor-not-allowed'
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
            className="px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors"
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
            className={`px-4 py-2 text-xs rounded-xl font-medium flex items-center gap-1.5 transition-colors ${
              currentSession.isDirty && validationIssues.length === 0
                ? 'bg-pastel-blue/20 text-pastel-blue hover:bg-pastel-blue/30 border border-pastel-blue/30 shadow-sm'
                : 'bg-muted/40 text-muted-foreground/50 border border-border/50 cursor-not-allowed'
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
