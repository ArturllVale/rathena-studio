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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pastel-blue/15 text-pastel-blue border border-pastel-blue/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Create New Item Combo</h2>
              <p className="text-[11px] text-muted-foreground">Define a set of items and the bonus script granted</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3.5 text-xs">
          {/* Target Layer */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Target File Layer</label>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className="w-full h-9 bg-background border border-border/80 rounded-xl px-3 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-pastel-blue/40"
            >
              {availableLayers.map((l) => (
                <option key={l.layer.id} value={l.layer.id}>
                  {l.layer.name} ({l.layer.relativePath})
                </option>
              ))}
            </select>
          </div>

          {/* Combo Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground font-medium">Combo Items (AegisName or ID)</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] text-pastel-blue hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-4">{idx + 1}.</span>
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    placeholder={`e.g. ${idx === 0 ? 'Apple' : 'Banana'}`}
                    className="h-9 bg-background border-border/80 text-xs text-foreground rounded-xl"
                  />
                  {items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
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
            <label className="block text-muted-foreground mb-1 font-medium">Bonus Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={3}
              className="w-full bg-background border border-border/80 rounded-xl p-3 text-xs font-mono text-emerald-500 dark:text-emerald-400 focus-visible:ring-1 focus-visible:ring-pastel-blue/40"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/80 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-pastel-blue/20 text-pastel-blue border border-pastel-blue/30 hover:bg-pastel-blue/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Create Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
