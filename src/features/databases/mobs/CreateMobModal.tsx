import { useState, useMemo } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { LayeredMobRepository } from '@/services/database/mob/layeredMobRepository';
import { MobDatabaseValidator } from '@/services/database/mobDatabaseValidator';
import { MobDatabaseSerializer } from '@/services/database/mob/mobDatabaseSerializer';
import { MobEditTransactionService } from '@/services/database/mobEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { MobDatabaseProvider } from '@/services/database/providers/mobDatabaseProvider';
import { MOB_ELEMENTS, MOB_RACES, MOB_SIZES, MobElement, MobRace, MobSize } from '@/domain/database/mob/mobTypes';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateMobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMobModal({ isOpen, onClose }: CreateMobModalProps) {
  const { registry, setSelectedMobId } = useDatabaseStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = registry?.getProvider('mob');

  const repo = useMemo(() => {
    if (!provider) return null;
    return provider.getRepository() as LayeredMobRepository | undefined;
  }, [provider]);

  // Auto suggest next custom mob ID e.g. 3000+
  const suggestedId = useMemo(() => {
    if (!repo) return 3001;
    const all = repo.getAllEffectiveMobs();
    if (all.length === 0) return 3001;
    const maxId = all.reduce((max, m) => Math.max(max, m.id), 3000);
    return maxId + 1;
  }, [repo]);

  const [id, setId] = useState<number>(suggestedId);
  const [aegisName, setAegisName] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [level, setLevel] = useState<number>(1);
  const [hp, setHp] = useState<number>(100);
  const [element, setElement] = useState<MobElement>('Neutral');
  const [race, setRace] = useState<MobRace>('Formless');
  const [size, setSize] = useState<MobSize>('Medium');
  const [targetLayerId, setTargetLayerId] = useState<string>('mob-db-import');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableLayers = useMemo(() => {
    if (!repo) return [];
    const layers = repo.getAllLayers();
    return [...layers].sort((a, b) => {
      if (a.layer.id === 'mob-db-import') return -1;
      if (b.layer.id === 'mob-db-import') return 1;
      return 0;
    });
  }, [repo]);

  if (!isOpen) return null;

  const existingMobById = repo?.findById(id);
  const existingMobByName = aegisName.trim() ? repo?.findByAegisName(aegisName.trim()) : null;

  const isIdValid = id > 0 && !existingMobById;
  const isAegisNameValid = Boolean(aegisName.trim()) && !existingMobByName;
  const canSubmit = isIdValid && isAegisNameValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !activeWorkspace || !provider) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new MobDatabaseValidator();
      const serializer = new MobDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new MobEditTransactionService(validator, serializer, writer);

      const newMobFields = {
        Id: id,
        AegisName: aegisName.trim(),
        Name: name.trim() || aegisName.trim(),
        Level: level,
        Hp: hp,
        Element: element,
        Race: race,
        Size: size,
      };

      await service.createMob(newMobFields, targetLayerId, provider as unknown as MobDatabaseProvider);

      setSelectedMobId(id);
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
            <h2 className="text-sm font-semibold text-neutral-100">Create New Monster</h2>
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
              Monster ID <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(Number(e.target.value))}
              placeholder="e.g. 3001"
              className={`w-full h-8 px-2.5 rounded bg-[#141416] border font-mono text-xs text-neutral-100 outline-none ${
                existingMobById ? 'border-red-500 text-red-300' : 'border-[#27272a] focus:border-sky-500'
              }`}
              required
            />
            {existingMobById && (
              <span className="text-[10px] text-red-400 font-mono">
                ID #{id} already exists ({existingMobById.fields.Name || existingMobById.fields.AegisName})!
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
              placeholder="e.g. CUSTOM_PORING"
              className={`w-full h-8 px-2.5 rounded bg-[#141416] border font-mono text-xs text-neutral-100 outline-none ${
                existingMobByName ? 'border-red-500 text-red-300' : 'border-[#27272a] focus:border-sky-500'
              }`}
              required
            />
            {existingMobByName && (
              <span className="text-[10px] text-red-400 font-mono">
                AegisName &quot;{aegisName}&quot; already in use by ID #{existingMobByName.id}!
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
              placeholder="e.g. Golden Poring"
              className="w-full h-8 px-2.5 rounded bg-[#141416] border border-[#27272a] text-xs text-neutral-100 outline-none focus:border-sky-500"
            />
          </div>

          {/* Stats: Level & HP */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Level</label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded bg-[#141416] border border-[#27272a] font-mono text-xs text-neutral-100 outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Max HP</label>
              <input
                type="number"
                value={hp}
                onChange={(e) => setHp(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded bg-[#141416] border border-[#27272a] font-mono text-xs text-neutral-100 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Element, Race, Size */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Element</label>
              <Select value={element} onValueChange={(val) => setElement(val as MobElement)}>
                <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                  <SelectValue placeholder="Element" />
                </SelectTrigger>
                <SelectContent>
                  {MOB_ELEMENTS.map((el) => (
                    <SelectItem key={el} value={el}>
                      {el}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Race</label>
              <Select value={race} onValueChange={(val) => setRace(val as MobRace)}>
                <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                  <SelectValue placeholder="Race" />
                </SelectTrigger>
                <SelectContent>
                  {MOB_RACES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Size</label>
              <Select value={size} onValueChange={(val) => setSize(val as MobSize)}>
                <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {MOB_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Layer / File Destination */}
          <div className="space-y-1 pt-1 border-t border-[#27272a]/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-neutral-300">Target File / Layer</label>
              <span className="text-[10px] text-sky-400 font-mono">
                {targetLayerId === 'mob-db-import' ? 'Default: Import' : 'Direct Layer'}
              </span>
            </div>
            <Select value={targetLayerId} onValueChange={setTargetLayerId}>
              <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {availableLayers.map((l) => (
                  <SelectItem key={l.layer.id} value={l.layer.id}>
                    {l.layer.relativePath} {l.layer.id === 'mob-db-import' ? '(Recommended)' : ''}
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
                  <Plus className="w-3.5 h-3.5" /> Create Monster
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
