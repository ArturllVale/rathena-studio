import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useItemGroupEditStore } from '@/stores/itemGroupEditStore';
import { ItemGroupDatabaseValidator } from '@/services/database/itemGroup/itemGroupDatabaseValidator';
import { ItemGroupDatabaseSerializer } from '@/services/database/itemGroup/itemGroupDatabaseSerializer';
import { ItemGroupEditTransactionService } from '@/services/database/itemGroupEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { ItemGroupDatabaseProvider } from '@/services/database/providers/itemGroupDatabaseProvider';
import { LayeredItemGroupRepository } from '@/services/database/itemGroup/layeredItemGroupRepository';
import { Input } from '@/components/ui/input';
import { X, Plus, Loader2, Layers } from 'lucide-react';
import { normalizeItemGroupKey } from '@/domain/database/itemGroup/itemGroupTypes';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { registry, setSelectedGroupKey } = useDatabaseStore();
  const { startSession } = useItemGroupEditStore();

  const [groupName, setGroupName] = useState<string>('');
  const [subGroup, setSubGroup] = useState<string>('');
  const [firstItem, setFirstItem] = useState<string>('Red_Potion');
  const [firstRate, setFirstRate] = useState<number>(10000);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('item-group-db-import');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const groupProvider = registry?.getProvider('group') as ItemGroupDatabaseProvider | undefined;
  const repo = groupProvider?.getRepository() as LayeredItemGroupRepository | undefined;
  const availableLayers = repo?.getAllLayers() || [];

  const handleCreate = async () => {
    if (!activeWorkspace || !groupProvider || !repo) return;

    if (!groupName.trim()) {
      setErrorMessage('Group identifier name is required.');
      return;
    }

    const subGroupNum = subGroup.trim() ? Number(subGroup) : undefined;
    const key = normalizeItemGroupKey(groupName.trim(), subGroupNum);
    if (repo.findByKey(key)) {
      setErrorMessage(`Item Group "${key}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new ItemGroupDatabaseValidator();
      const serializer = new ItemGroupDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemGroupEditTransactionService(validator, serializer, writer);

      await service.createGroup(
        {
          Group: groupName.trim(),
          SubGroup: subGroupNum,
          List: [
            {
              Item: firstItem.trim(),
              Rate: firstRate,
              Amount: 1,
            },
          ],
        },
        selectedLayerId,
        groupProvider
      );

      const created = repo.findByKey(key);
      if (created) {
        setSelectedGroupKey(created.key);
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
            <div className="p-2 rounded-xl bg-pastel-mint/15 text-pastel-mint border border-pastel-mint/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Create New Item Group</h2>
              <p className="text-[11px] text-muted-foreground">Define a group of items for box openings or random drops</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Group Name / ID</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. IG_Old_Blue_Box"
                className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">SubGroup (Optional)</label>
              <Input
                type="number"
                value={subGroup}
                onChange={(e) => setSubGroup(e.target.value)}
                placeholder="e.g. 1"
                className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Initial Item</label>
              <Input
                value={firstItem}
                onChange={(e) => setFirstItem(e.target.value)}
                placeholder="e.g. Red_Potion"
                className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Rate (10000 = 100%)</label>
              <Input
                type="number"
                value={firstRate}
                onChange={(e) => setFirstRate(Number(e.target.value))}
                className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
              />
            </div>
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
            <span>Create Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}
