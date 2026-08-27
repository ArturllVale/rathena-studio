import { useState, useMemo } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { LayeredSkillRepository } from '@/services/database/skill/layeredSkillRepository';
import { SkillDatabaseValidator } from '@/services/database/skillDatabaseValidator';
import { SkillDatabaseSerializer } from '@/services/database/skill/skillDatabaseSerializer';
import { SkillEditTransactionService } from '@/services/database/skillEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { SkillDatabaseProvider } from '@/services/database/providers/skillDatabaseProvider';
import { SKILL_TYPES, SKILL_TARGET_TYPES, SkillType, SkillTargetType } from '@/domain/database/skill/skillTypes';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSkillModal({ isOpen, onClose }: CreateSkillModalProps) {
  const { registry, setSelectedSkillId } = useDatabaseStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = registry?.getProvider('skill');

  const repo = useMemo(() => {
    if (!provider) return null;
    return provider.getRepository() as LayeredSkillRepository | undefined;
  }, [provider]);

  // Auto suggest next custom skill ID e.g. 8500+
  const suggestedId = useMemo(() => {
    if (!repo) return 8501;
    const all = repo.getAllEffectiveSkills();
    if (all.length === 0) return 8501;
    const maxId = all.reduce((max, s) => Math.max(max, s.id), 8500);
    return maxId + 1;
  }, [repo]);

  const [id, setId] = useState<number>(suggestedId);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maxLevel, setMaxLevel] = useState<number>(10);
  const [type, setType] = useState<SkillType>('Magic');
  const [targetType, setTargetType] = useState<SkillTargetType>('Attack');
  const [targetLayerId, setTargetLayerId] = useState<string>('skill-db-import');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableLayers = useMemo(() => {
    if (!repo) return [];
    const layers = repo.getAllLayers();
    return [...layers].sort((a, b) => {
      if (a.layer.id === 'skill-db-import') return -1;
      if (b.layer.id === 'skill-db-import') return 1;
      return 0;
    });
  }, [repo]);

  if (!isOpen) return null;

  const existingSkillById = repo?.findById(id);
  const existingSkillByName = name.trim() ? repo?.findByName(name.trim()) : null;

  const isIdValid = id > 0 && !existingSkillById;
  const isAegisNameValid = Boolean(name.trim()) && !existingSkillByName;
  const canSubmit = isIdValid && isAegisNameValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !activeWorkspace || !provider) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validator = new SkillDatabaseValidator();
      const serializer = new SkillDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new SkillEditTransactionService(validator, serializer, writer);

      const newSkillFields = {
        Id: id,
        Name: name.trim(),
        Description: description.trim() || name.trim(),
        MaxLevel: maxLevel,
        Type: type,
        TargetType: targetType,
      };

      await service.createSkill(newSkillFields, targetLayerId, provider as unknown as SkillDatabaseProvider);

      setSelectedSkillId(id);
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
            <h2 className="text-sm font-semibold text-neutral-100">Create New Skill</h2>
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
              Skill ID <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(Number(e.target.value))}
              placeholder="e.g. 8501"
              className={`w-full h-8 px-2.5 rounded bg-[#141416] border font-mono text-xs text-neutral-100 outline-none ${
                existingSkillById ? 'border-red-500 text-red-300' : 'border-[#27272a] focus:border-sky-500'
              }`}
              required
            />
            {existingSkillById && (
              <span className="text-[10px] text-red-400 font-mono">
                ID #{id} already exists ({existingSkillById.name})!
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CUSTOM_FIRE_BOLT"
              className={`w-full h-8 px-2.5 rounded bg-[#141416] border font-mono text-xs text-neutral-100 outline-none ${
                existingSkillByName ? 'border-red-500 text-red-300' : 'border-[#27272a] focus:border-sky-500'
              }`}
              required
            />
            {existingSkillByName && (
              <span className="text-[10px] text-red-400 font-mono">
                AegisName &quot;{name}&quot; already in use by ID #{existingSkillByName.id}!
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-300">Skill Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advanced Fire Bolt"
              className="w-full h-8 px-2.5 rounded bg-[#141416] border border-[#27272a] text-xs text-neutral-100 outline-none focus:border-sky-500"
            />
          </div>

          {/* MaxLevel, Type, TargetType */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Max Level</label>
              <input
                type="number"
                value={maxLevel}
                onChange={(e) => setMaxLevel(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded bg-[#141416] border border-[#27272a] font-mono text-xs text-neutral-100 outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Type</label>
              <Select value={type} onValueChange={(val) => setType(val as SkillType)}>
                <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Target</label>
              <Select value={targetType} onValueChange={(val) => setTargetType(val as SkillTargetType)}>
                <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_TARGET_TYPES.map((tt) => (
                    <SelectItem key={tt} value={tt}>
                      {tt}
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
                {targetLayerId === 'skill-db-import' ? 'Default: Import' : 'Direct Layer'}
              </span>
            </div>
            <Select value={targetLayerId} onValueChange={setTargetLayerId}>
              <SelectTrigger className="h-8 text-xs font-mono border-[#27272a]">
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {availableLayers.map((l) => (
                  <SelectItem key={l.layer.id} value={l.layer.id}>
                    {l.layer.relativePath} {l.layer.id === 'skill-db-import' ? '(Recommended)' : ''}
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
                  <Plus className="w-3.5 h-3.5" /> Create Skill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
