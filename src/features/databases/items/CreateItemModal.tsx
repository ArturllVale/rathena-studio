import { useState, useMemo } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { ItemType, ITEM_TYPES, WEAPON_SUBTYPES, AMMO_SUBTYPES, WeaponSubType, AmmoSubType } from '@/domain/database/item/itemTypes';
import { LayeredItemRepository } from '@/services/database/layeredItemRepository';
import { ItemDatabaseValidator } from '@/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '@/services/database/itemDatabaseSerializer';
import { ItemEditTransactionService } from '@/services/database/itemEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { ItemDatabaseProvider } from '@/services/database/providers/itemDatabaseProvider';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateItemModal({ isOpen, onClose }: CreateItemModalProps) {
  const { registry, setSelectedItemId } = useDatabaseStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = registry?.getProvider('item');

  const repo = useMemo(() => {
    if (!provider) return null;
    return provider.getRepository() as LayeredItemRepository | undefined;
  }, [provider]);

  // Suggest next ID e.g. 20000+ or max + 1
  const suggestedId = useMemo(() => {
    if (!repo) return 20001;
    const all = repo.getAllEffectiveItems();
    if (all.length === 0) return 20001;
    const maxCustom = all
      .map((i) => i.id)
      .filter((id) => id >= 20000 && id < 100000)
      .reduce((max, id) => Math.max(max, id), 20000);
    return maxCustom + 1;
  }, [repo]);

  const [id, setId] = useState<number>(suggestedId);
  const [aegisName, setAegisName] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<ItemType>('Weapon');
  const [subType, setSubType] = useState<string>('1hSword');
  const [targetLayerId, setTargetLayerId] = useState<string>('item-db-import');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available layers in the current repository
  const availableLayers = useMemo(() => {
    if (!repo) return [];
    const layers = repo.getAllLayers();
    // Prioritize import layer first, then mode layers
    return [...layers].sort((a, b) => {
      if (a.layer.id === 'item-db-import') return -1;
      if (b.layer.id === 'item-db-import') return 1;
      return 0;
    });
  }, [repo]);

  if (!isOpen) return null;

  // Uniqueness validation
  const existingItemById = repo?.findById(id);
  const existingItemByName = aegisName.trim() ? repo?.findByAegisName(aegisName.trim()) : null;

  const isIdValid = id > 0 && !existingItemById;
  const isAegisNameValid = Boolean(aegisName.trim()) && !existingItemByName;
  const canSubmit = isIdValid && isAegisNameValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !activeWorkspace || !provider) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new ItemDatabaseValidator();
      const serializer = new ItemDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemEditTransactionService(validator, serializer, writer);

      const newItemFields = {
        Id: id,
        AegisName: aegisName.trim(),
        Name: name.trim() || aegisName.trim(),
        Type: type,
        ...(type === 'Weapon' ? { SubType: subType as WeaponSubType } : {}),
        ...(type === 'Ammo' ? { SubType: subType as AmmoSubType } : {}),
      };

      await service.createItem(newItemFields, targetLayerId, provider as unknown as ItemDatabaseProvider);

      setSelectedItemId(id);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Create New Item</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {errorMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ID */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-300">
              Item ID <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(Number(e.target.value))}
              placeholder="e.g. 20001"
              className={`w-full h-8 px-2.5 rounded bg-[#141416] border font-mono text-xs text-neutral-100 outline-none ${
                existingItemById ? 'border-red-500 text-red-300' : 'border-[#27272a] focus:border-sky-500'
              }`}
              required
            />
            {existingItemById && (
              <span className="text-[10px] text-red-400 font-mono">
                ID #{id} already exists ({existingItemById.fields.Name || existingItemById.fields.AegisName})!
              </span>
            )}
          </div>

          {/* AegisName */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-300">
              Aegis Name (Identifier) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={aegisName}
              onChange={(e) => setAegisName(e.target.value)}
              placeholder="e.g. Custom_Dragon_Sword"
              className={`w-full h-8 px-2.5 rounded bg-[#141416] border font-mono text-xs text-neutral-100 outline-none ${
                existingItemByName ? 'border-red-500 text-red-300' : 'border-[#27272a] focus:border-sky-500'
              }`}
              required
            />
            {existingItemByName && (
              <span className="text-[10px] text-red-400 font-mono">
                AegisName &quot;{aegisName}&quot; already in use by ID #{existingItemByName.id}!
              </span>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-300">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dragon Slayer V2"
              className="w-full h-8 px-2.5 rounded bg-[#141416] border border-[#27272a] text-xs text-neutral-100 outline-none focus:border-sky-500"
            />
          </div>

          {/* Type & SubType */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Type</label>
              <Select value={type} onValueChange={(val) => setType(val as ItemType)}>
                <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'Weapon' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-300">Weapon SubType</label>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                    <SelectValue placeholder="SubType" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEAPON_SUBTYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === 'Ammo' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-300">Ammo SubType</label>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                    <SelectValue placeholder="SubType" />
                  </SelectTrigger>
                  <SelectContent>
                    {AMMO_SUBTYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Target Layer / File Destination */}
          <div className="space-y-1 pt-1 border-t border-[#27272a]/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-neutral-300">Target File / Layer</label>
              <span className="text-[10px] text-sky-400 font-mono">
                {targetLayerId === 'item-db-import' ? 'Default: Import' : 'Direct Layer'}
              </span>
            </div>
            <Select value={targetLayerId} onValueChange={setTargetLayerId}>
              <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {availableLayers.map((l) => (
                  <SelectItem key={l.layer.id} value={l.layer.id}>
                    {l.layer.relativePath} {l.layer.id === 'item-db-import' ? '(Recommended)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-neutral-400 hover:text-neutral-200 hover:bg-[#27272a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-xs px-4 py-1.5 rounded shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Create Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
