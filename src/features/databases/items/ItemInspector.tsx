import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { ItemDatabaseValidator } from '@/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '@/services/database/itemDatabaseSerializer';
import { ItemEditTransactionService } from '@/services/database/itemEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Undo2, Redo2, Layers, Sliders, ShieldCheck, Flag, ScrollText, FileCode, Link2 } from 'lucide-react';
import { ItemIdentitySection } from './inspector/ItemIdentitySection';
import { ItemCombatSection } from './inspector/ItemCombatSection';
import { ItemRequirementsSection } from './inspector/ItemRequirementsSection';
import { ItemSubstructuresSection } from './inspector/ItemSubstructuresSection';
import { ItemScriptEditorSection } from './inspector/ItemScriptEditorSection';
import { ItemLinkedSystemsSection } from './inspector/ItemLinkedSystemsSection';
import { LayeredItemRepository } from '@/services/database/layeredItemRepository';
import { ItemDatabaseProvider } from '@/services/database/providers/itemDatabaseProvider';
import { openEntityInYamlEditor } from '@/stores/yamlEditorStore';

type InspectorTab = 'general' | 'requirements' | 'flags_trade' | 'scripts' | 'linked_systems' | 'provenance';

export function ItemInspector({ itemId }: { itemId: number }) {
  const [currentTab, setCurrentTab] = useState<InspectorTab>('general');
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('item'));



  const {
    currentSession,
    startSession,
    cancelSession,
    undo,
    redo,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useItemEditStore();

  const itemMeta = useDatabaseStore((s) => s.metadataMap['item']);

  const item: EffectiveItem | undefined = useMemo(() => {
    if (!provider || !itemId) return undefined;
    const repository = provider.getRepository() as LayeredItemRepository | undefined;
    if (!repository || typeof repository.findById !== 'function') return undefined;
    return repository.findById(itemId);
  }, [provider, itemId, itemMeta]);

  // When item changes, start a new session
  useEffect(() => {
    if (item) {
      startSession(item);
    } else {
      cancelSession();
    }
  }, [item, startSession, cancelSession]);

  // Validate on change
  useEffect(() => {
    if (!currentSession) return;
    const validator = new ItemDatabaseValidator();
    const service = new ItemEditTransactionService(validator, new ItemDatabaseSerializer(), {
      writeFile: async () => {},
    });
    const issues = service.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, setValidationIssues]);

  if (!item || !currentSession) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Item not found
      </div>
    );
  }

  const { fields, layerProvenance } = item;
  const pendingChanges = currentSession.getPendingChanges();

  const handleSave = async () => {
    if (!activeWorkspace || !provider) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const validator = new ItemDatabaseValidator();
      const serializer = new ItemDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemEditTransactionService(validator, serializer, writer);

      await service.commitSession(currentSession, provider as unknown as ItemDatabaseProvider);

      useDatabaseStore.getState().refreshMetadata();

      // Reload UI state with newly committed item
      const repo = provider.getRepository() as LayeredItemRepository | undefined;
      const updatedItem = repo?.findById(itemId);
      if (updatedItem) {
        startSession(updatedItem);
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
              {fields.Name || 'Unknown'}
            </div>
            <div className="text-xs font-mono text-pastel-blue mt-0.5 font-semibold tracking-wide">{fields.AegisName || 'Unknown'}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const primaryPath = Object.values(item.fieldOrigins)[0]?.filePath || layerProvenance[0] || 'item_db.yml';
                openEntityInYamlEditor(primaryPath, item.id, layerProvenance[0]);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 hover:border-primary/40 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Open in YAML Editor"
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span>YAML</span>
            </button>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground border border-border/60 font-semibold">
              #{item.id}
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
            <span>General & Combat</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('requirements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'requirements'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Requirements</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('flags_trade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'flags_trade'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flags & Trade</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('scripts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'scripts'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Scripts</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('linked_systems')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
              currentTab === 'linked_systems'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Combos & Groups</span>
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

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 select-text bg-background/40">
        {/* Semantic Diff Notification */}
        {currentSession.isDirty && (
          <SemanticDiffViewer
            original={item.fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Item Changes"
          />
        )}

        {commitError && (
          <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400 break-all">
            {commitError}
          </div>
        )}

        {currentTab === 'general' && (
          <div className="space-y-4">
            <ItemIdentitySection item={item} />
            <ItemCombatSection item={item} />
          </div>
        )}

        {currentTab === 'requirements' && (
          <ItemRequirementsSection item={item} />
        )}

        {currentTab === 'flags_trade' && (
          <ItemSubstructuresSection item={item} />
        )}

        {currentTab === 'scripts' && (
          <ItemScriptEditorSection item={item} />
        )}

        {currentTab === 'linked_systems' && (
          <ItemLinkedSystemsSection item={item} />
        )}

        {currentTab === 'provenance' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Layer Hierarchy & File Provenance
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">
                  {layerProvenance.length} layer{layerProvenance.length > 1 ? 's' : ''} loaded
                </span>
              </div>

              <div className="space-y-2.5">
                {layerProvenance.map((layerId, idx) => {
                  const repository = provider ? (provider.getRepository() as LayeredItemRepository | undefined) : undefined;
                  const layerData = repository?.getLayer ? repository.getLayer(layerId) : undefined;
                  const relativePath =
                    layerData?.layer.relativePath ||
                    Object.values(item.fieldOrigins).find((o) => o.layerId === layerId)?.filePath ||
                    layerId;
                  const layerName = layerData?.layer.name || layerId;
                  const isFinalLayer = idx === layerProvenance.length - 1;
                  const isBaseLayer = idx === 0;

                  const contributingFields = Object.entries(item.fieldOrigins)
                    .filter(([_, origin]) => origin.layerId === layerId)
                    .map(([fieldName]) => fieldName);

                  return (
                    <div
                      key={layerId}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isFinalLayer
                          ? 'bg-primary/10 border-primary/30 shadow-2xs'
                          : 'bg-card border-border/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-semibold ${
                              isFinalLayer
                                ? 'bg-primary text-primary-foreground'
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
                          className={`text-xs font-mono px-2 py-0.5 rounded-md border whitespace-nowrap font-medium ${
                            relativePath.includes('import')
                              ? 'bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25'
                              : isBaseLayer
                              ? 'bg-secondary text-muted-foreground border-border/70'
                              : 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25'
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
          <button
            type="button"
            className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/60 transition-colors"
            onClick={() => {
              cancelSession();
              startSession(item);
            }}
            disabled={!currentSession.isDirty || isCommitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs rounded-lg font-semibold flex items-center gap-2 transition-all ${
              currentSession.isDirty && validationIssues.length === 0
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs'
                : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
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
