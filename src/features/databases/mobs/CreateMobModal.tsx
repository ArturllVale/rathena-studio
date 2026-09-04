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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-card/90 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pastel-rose/15 text-pastel-rose border border-pastel-rose/30">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Create New Monster</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ID */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Monster ID <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(Number(e.target.value))}
              placeholder="e.g. 3001"
              className={`w-full h-9 px-3 rounded-xl bg-background border font-mono text-xs text-foreground outline-none transition-colors ${
                existingMobById ? 'border-destructive text-destructive' : 'border-border/80 focus:border-pastel-blue/60'
              }`}
              required
            />
            {existingMobById && (
              <span className="text-[10px] text-destructive font-mono">
                ID #{id} already exists ({existingMobById.fields.Name || existingMobById.fields.AegisName})!
              </span>
            )}
          </div>

          {/* AegisName */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Aegis Name (Identifier) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={aegisName}
              onChange={(e) => setAegisName(e.target.value)}
              placeholder="e.g. CUSTOM_PORING"
              className={`w-full h-9 px-3 rounded-xl bg-background border font-mono text-xs text-foreground outline-none transition-colors ${
                existingMobByName ? 'border-destructive text-destructive' : 'border-border/80 focus:border-pastel-blue/60'
              }`}
              required
            />
            {existingMobByName && (
              <span className="text-[10px] text-destructive font-mono">
                AegisName &quot;{aegisName}&quot; already in use by ID #{existingMobByName.id}!
              </span>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Golden Poring"
              className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 text-xs text-foreground outline-none focus:border-pastel-blue/60 transition-colors"
            />
          </div>

          {/* Stats: Level & HP */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Level</label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 font-mono text-xs text-foreground outline-none focus:border-pastel-blue/60 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Max HP</label>
              <input
                type="number"
                value={hp}
                onChange={(e) => setHp(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 font-mono text-xs text-foreground outline-none focus:border-pastel-blue/60 transition-colors"
              />
            </div>
          </div>

          {/* Element, Race, Size */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Element</label>
              <Select value={element} onValueChange={(val) => setElement(val as MobElement)}>
                <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
              <label className="text-[11px] font-medium text-foreground">Race</label>
              <Select value={race} onValueChange={(val) => setRace(val as MobRace)}>
                <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
              <label className="text-[11px] font-medium text-foreground">Size</label>
              <Select value={size} onValueChange={(val) => setSize(val as MobSize)}>
                <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
          <div className="space-y-1 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-foreground">Target File / Layer</label>
              <span className="text-[10px] text-pastel-blue font-mono">
                {targetLayerId === 'mob-db-import' ? 'Default: Import' : 'Direct Layer'}
              </span>
            </div>
            <Select value={targetLayerId} onValueChange={setTargetLayerId}>
              <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-1.5 bg-pastel-rose/20 text-pastel-rose border border-pastel-rose/30 hover:bg-pastel-rose/30 disabled:opacity-40 font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
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
