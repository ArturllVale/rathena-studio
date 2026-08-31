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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1f1f23] border border-[#27272a] rounded-lg max-w-lg w-full p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Create New Item Group</h2>
              <p className="text-[11px] text-neutral-400">Define a group of items for box openings or random drops</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Group Name / ID</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. IG_Old_Blue_Box"
                className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">SubGroup (Optional)</label>
              <Input
                type="number"
                value={subGroup}
                onChange={(e) => setSubGroup(e.target.value)}
                placeholder="e.g. 1"
                className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Initial Item</label>
              <Input
                value={firstItem}
                onChange={(e) => setFirstItem(e.target.value)}
                placeholder="e.g. Red_Potion"
                className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Rate (10000 = 100%)</label>
              <Input
                type="number"
                value={firstRate}
                onChange={(e) => setFirstRate(Number(e.target.value))}
                className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
              />
            </div>
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
            <span>Create Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}
