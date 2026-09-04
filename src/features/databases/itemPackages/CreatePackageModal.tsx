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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pastel-lavender/15 text-pastel-lavender border border-pastel-lavender/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Create New Item Package</h2>
              <p className="text-[11px] text-muted-foreground">Bundle item package with random rolls or fixed group slots</p>
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

          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Package AegisName</label>
            <Input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Starter_Package_Box"
              className="h-9 bg-background border-border/80 text-xs font-mono text-foreground rounded-xl"
            />
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
            <span>Create Package</span>
          </button>
        </div>
      </div>
    </div>
  );
}
