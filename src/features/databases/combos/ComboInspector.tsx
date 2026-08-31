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
import { Loader2, Undo2, Redo2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { Input } from '@/components/ui/input';

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

  const combo: EffectiveItemCombo | undefined = useMemo(() => {
    if (!provider || !comboKey) return undefined;
    const repository = provider.getRepository() as LayeredComboRepository | undefined;
    if (!repository || typeof repository.findByKey !== 'function') return undefined;
    return repository.findByKey(comboKey);
  }, [provider, comboKey]);

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
      className="flex flex-col h-full bg-[#141416] outline-none select-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
              {combo.fields.Combo.join(' + ')}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">{combo.fields.Combo.length} Items in Combo</div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-amber-400 border border-[#27272a] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>COMBO</span>
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('general')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'general'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Combo Items
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('script')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'script'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Script
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
            original={combo.fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Combo Changes"
          />
        )}

        {commitError && (
          <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400 break-all">
            {commitError}
          </div>
        )}

        {currentTab === 'general' && (
          <div className="space-y-3 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Combo Items List
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {(effectiveFields.Combo || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-500 w-4">{idx + 1}.</span>
                  <Input
                    value={String(item)}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
                  />
                  {(effectiveFields.Combo || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'script' && (
          <div className="space-y-2 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Combo Bonus Script
            </h3>
            <textarea
              value={effectiveFields.Script || ''}
              onChange={(e) => setField('Script', e.target.value)}
              rows={8}
              placeholder="bonus bMaxHP, 100; ..."
              className="w-full bg-[#141416] border border-[#27272a] rounded p-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500"
            />
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
              startSession(combo);
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
