import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useItemPackageEditStore } from '@/stores/itemPackageEditStore';
import { ItemPackageDatabaseValidator } from '@/services/database/itemPackage/itemPackageDatabaseValidator';
import { ItemPackageDatabaseSerializer } from '@/services/database/itemPackage/itemPackageDatabaseSerializer';
import { ItemPackageEditTransactionService } from '@/services/database/itemPackageEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { ItemPackageDatabaseProvider } from '@/services/database/providers/itemPackageDatabaseProvider';
import { LayeredItemPackageRepository } from '@/services/database/itemPackage/layeredItemPackageRepository';
import { Input } from '@/components/ui/input';
import { X, Plus, Loader2, Package } from 'lucide-react';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePackageModal({ isOpen, onClose }: CreatePackageModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { registry, setSelectedPackageName } = useDatabaseStore();
  const { startSession } = useItemPackageEditStore();

  const [packageName, setPackageName] = useState<string>('');
  const [firstItem, setFirstItem] = useState<string>('Red_Potion');
  const [firstRate, setFirstRate] = useState<number>(10000);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('item-package-db-import');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const pkgProvider = registry?.getProvider('package') as ItemPackageDatabaseProvider | undefined;
  const repo = pkgProvider?.getRepository() as LayeredItemPackageRepository | undefined;
  const availableLayers = repo?.getAllLayers() || [];

  const handleCreate = async () => {
    if (!activeWorkspace || !pkgProvider || !repo) return;

    if (!packageName.trim()) {
      setErrorMessage('Package AegisName identifier is required.');
      return;
    }

    if (repo.findByPackage(packageName.trim())) {
      setErrorMessage(`Item Package "${packageName.trim()}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new ItemPackageDatabaseValidator();
      const serializer = new ItemPackageDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemPackageEditTransactionService(validator, serializer, writer);

      await service.createPackage(
        {
          Package: packageName.trim(),
          RandomOptions: {
            Count: 1,
            List: [
              {
                Item: firstItem.trim(),
                Rate: firstRate,
              },
            ],
          },
        },
        selectedLayerId,
        pkgProvider
      );

      const created = repo.findByPackage(packageName.trim());
      if (created) {
        setSelectedPackageName(created.package);
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
            <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Create New Item Package</h2>
              <p className="text-[11px] text-neutral-400">Bundle item package with random rolls or fixed group slots</p>
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

          <div>
            <label className="block text-neutral-400 mb-1">Package AegisName</label>
            <Input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Starter_Package_Box"
              className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
            />
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
            <span>Create Package</span>
          </button>
        </div>
      </div>
    </div>
  );
}
