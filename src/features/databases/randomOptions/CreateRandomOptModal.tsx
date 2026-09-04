import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useRandomOptEditStore } from '@/stores/randomOptEditStore';
import { RandomOptDatabaseValidator } from '@/services/database/randomOpt/randomOptDatabaseValidator';
import { RandomOptDatabaseSerializer } from '@/services/database/randomOpt/randomOptDatabaseSerializer';
import { RandomOptEditTransactionService } from '@/services/database/randomOptEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { RandomOptDatabaseProvider } from '@/services/database/providers/randomOptDatabaseProvider';
import { LayeredRandomOptRepository } from '@/services/database/randomOpt/layeredRandomOptRepository';
import { Input } from '@/components/ui/input';
import { X, Plus, Loader2, Dices } from 'lucide-react';

interface CreateRandomOptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRandomOptModal({ isOpen, onClose }: CreateRandomOptModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { registry, setSelectedRandomOptId, setSelectedRandomGroupId } = useDatabaseStore();
  const { startOptionSession, startGroupSession } = useRandomOptEditStore();

  const [mode, setMode] = useState<'option' | 'group'>('option');
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [script, setScript] = useState<string>('bonus bMaxHP, getrandomoptinfo(ROPT_VALUE);');
  const [selectedLayerId, setSelectedLayerId] = useState<string>('randomopt-db-import');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const optProvider = registry?.getProvider('randomopt') as RandomOptDatabaseProvider | undefined;
  const repo = optProvider?.getRepository() as LayeredRandomOptRepository | undefined;
  const availableOptionLayers = repo?.getAllOptionLayers() || [];
  const availableGroupLayers = repo?.getAllGroupLayers() || [];

  const handleCreate = async () => {
    if (!activeWorkspace || !optProvider || !repo) return;

    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      setErrorMessage('ID must be a positive integer.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Identifier name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new RandomOptDatabaseValidator();
      const serializer = new RandomOptDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new RandomOptEditTransactionService(validator, serializer, writer);

      if (mode === 'option') {
        if (repo.findOptionById(numId)) {
          throw new Error(`Random Option with ID ${numId} already exists.`);
        }
        await service.createOption(
          {
            Id: numId,
            Option: name.trim(),
            Script: script.trim() ? script : undefined,
          },
          selectedLayerId,
          optProvider
        );
        const created = repo.findOptionById(numId);
        if (created) {
          setSelectedRandomOptId(created.id);
          startOptionSession(created);
        }
      } else {
        if (repo.findGroupById(numId)) {
          throw new Error(`Random Option Group with ID ${numId} already exists.`);
        }
        await service.createGroup(
          {
            Id: numId,
            Group: name.trim(),
            MaxRandom: 5,
            Slots: [
              {
                Slot: 1,
                Options: [
                  {
                    Option: 'VAR_MAXHPAMOUNT',
                    MinValue: 100,
                    MaxValue: 1000,
                    Chance: 5000,
                  },
                ],
              },
            ],
          },
          selectedLayerId,
          optProvider
        );
        const created = repo.findGroupById(numId);
        if (created) {
          setSelectedRandomGroupId(created.id);
          startGroupSession(created);
        }
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
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Create New {mode === 'option' ? 'Random Option' : 'Option Group'}
              </h2>
              <p className="text-[11px] text-muted-foreground">Configure parameters, scripts and probabilities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border/80 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('option');
              setSelectedLayerId('randomopt-db-import');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'option' ? 'bg-pastel-blue/20 text-pastel-blue font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Random Option (`item_randomopt_db.yml`)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('group');
              setSelectedLayerId('randomopt-grp-db-import');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'group' ? 'bg-pastel-blue/20 text-pastel-blue font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Option Group (`item_randomopt_group.yml`)
          </button>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Target File Layer</label>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className="w-full h-9 bg-background border border-border/80 rounded-xl px-3 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-pastel-blue/40"
            >
              {(mode === 'option' ? availableOptionLayers : availableGroupLayers).map((l) => (
                <option key={l.layer.id} value={l.layer.id}>
                  {l.layer.name} ({l.layer.relativePath})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Numeric ID</label>
              <Input
                type="number"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. 101"
                className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">
                {mode === 'option' ? 'Option Constant' : 'Group Name'}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === 'option' ? 'e.g. VAR_MAXHPAMOUNT' : 'e.g. ROPTG_PHYSICAL'}
                className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
              />
            </div>
          </div>

          {mode === 'option' && (
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Option Script</label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={3}
                className="w-full bg-background border border-border/80 rounded-xl p-3 text-xs font-mono text-emerald-500 dark:text-emerald-400 focus-visible:ring-1 focus-visible:ring-pastel-blue/40"
              />
            </div>
          )}
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
            <span>Create {mode === 'option' ? 'Option' : 'Group'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
