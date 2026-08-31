import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useComboEditStore } from '@/stores/comboEditStore';
import { ComboDatabaseValidator } from '@/services/database/combo/comboDatabaseValidator';
import { ComboDatabaseSerializer } from '@/services/database/combo/comboDatabaseSerializer';
import { ComboEditTransactionService } from '@/services/database/comboEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { ComboDatabaseProvider } from '@/services/database/providers/comboDatabaseProvider';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { Input } from '@/components/ui/input';
import { X, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { normalizeComboKey } from '@/domain/database/combo/comboTypes';

interface CreateComboModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateComboModal({ isOpen, onClose }: CreateComboModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { registry, setSelectedComboKey } = useDatabaseStore();
  const { startSession } = useComboEditStore();

  const [items, setItems] = useState<string[]>(['', '']);
  const [script, setScript] = useState<string>('bonus bMaxHP, 100;');
  const [selectedLayerId, setSelectedLayerId] = useState<string>('combo-db-import');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const comboProvider = registry?.getProvider('combo') as ComboDatabaseProvider | undefined;
  const repo = comboProvider?.getRepository() as LayeredComboRepository | undefined;
  const availableLayers = repo?.getAllLayers() || [];

  const handleAddItem = () => {
    setItems((prev) => [...prev, '']);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 2) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, val: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleCreate = async () => {
    if (!activeWorkspace || !comboProvider || !repo) return;

    const filteredItems = items.map((i) => i.trim()).filter((i) => i.length > 0);
    if (filteredItems.length < 2) {
      setErrorMessage('A combo must contain at least 2 non-empty items.');
      return;
    }

    const key = normalizeComboKey(filteredItems);
    if (repo.findByKey(key)) {
      setErrorMessage(`A combo with items "${key}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new ComboDatabaseValidator();
      const serializer = new ComboDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ComboEditTransactionService(validator, serializer, writer);

      await service.createCombo(
        {
          Combo: filteredItems,
          Script: script.trim() ? script : undefined,
        },
        selectedLayerId,
        comboProvider
      );

      const created = repo.findByKey(key);
      if (created) {
        setSelectedComboKey(created.key);
        startSession(created);
      }

      onClose();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1f1f23] border border-[#27272a] rounded-lg max-w-lg w-full p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-sky-500/10 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Create New Item Combo</h2>
              <p className="text-[11px] text-neutral-400">Define a set of items and the bonus script granted</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-950/20 border border-red-500/20 p-2.5 rounded text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Target Layer */}
          <div>
            <label className="block text-neutral-400 mb-1">Target File Layer</label>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className="w-full bg-[#141416] border border-[#27272a] rounded px-2.5 py-1.5 text-neutral-200"
            >
              {availableLayers.map((l) => (
                <option key={l.layer.id} value={l.layer.id}>
                  {l.layer.name} ({l.layer.relativePath})
                </option>
              ))}
            </select>
          </div>

          {/* Combo Items */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-400">Combo Items (AegisName or ID)</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-500 w-4">{idx + 1}.</span>
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    placeholder={`e.g. ${idx === 0 ? 'Apple' : 'Banana'}`}
                    className="h-8 bg-[#141416] border-[#27272a] text-xs"
                  />
                  {items.length > 2 && (
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

          {/* Script */}
          <div>
            <label className="block text-neutral-400 mb-1">Bonus Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={3}
              className="w-full bg-[#141416] border border-[#27272a] rounded p-2 text-xs font-mono text-emerald-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#27272a] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCreate}
            className="px-3 py-1.5 rounded text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Create Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
