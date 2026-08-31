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

  const item: EffectiveItem | undefined = useMemo(() => {
    if (!provider || !itemId) return undefined;
    const repository = provider.getRepository() as LayeredItemRepository | undefined;
    if (!repository || typeof repository.findById !== 'function') return undefined;
    return repository.findById(itemId);
  }, [provider, itemId]);

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
      className="flex flex-col h-full bg-[#141416] outline-none select-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-neutral-100 leading-tight">
              {fields.Name || 'Unknown'}
            </div>
            <div className="text-xs font-mono text-sky-400 mt-0.5">{fields.AegisName || 'Unknown'}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const primaryPath = Object.values(item.fieldOrigins)[0]?.filePath || layerProvenance[0] || 'item_db.yml';
                openEntityInYamlEditor(primaryPath, item.id, layerProvenance[0]);
              }}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-300 hover:text-sky-300 border border-[#27272a] hover:border-sky-500/40 flex items-center gap-1 transition-colors"
              title="Open in YAML Monaco Editor"
            >
              <FileCode className="w-3 h-3 text-sky-400" />
              <span>YAML</span>
            </button>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400 border border-[#27272a]">
              #{item.id}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('general')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'general'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General & Combat</span>
          </button>


          <button
            type="button"
            onClick={() => setCurrentTab('requirements')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'requirements'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Requirements</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('flags_trade')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'flags_trade'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flags & Trade</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('scripts')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'scripts'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Scripts</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('linked_systems')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'linked_systems'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Combos & Groups</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('provenance')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'provenance'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
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
              startSession(item);
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
