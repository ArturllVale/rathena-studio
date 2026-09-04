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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-card/90 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pastel-blue/15 text-pastel-blue border border-pastel-blue/30">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Create New Skill</h2>
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
              Skill ID <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(Number(e.target.value))}
              placeholder="e.g. 8501"
              className={`w-full h-9 px-3 rounded-xl bg-background border font-mono text-xs text-foreground outline-none transition-colors ${
                existingSkillById ? 'border-destructive text-destructive' : 'border-border/80 focus:border-pastel-blue/60'
              }`}
              required
            />
            {existingSkillById && (
              <span className="text-[10px] text-destructive font-mono">
                ID #{id} already exists ({existingSkillById.name})!
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CUSTOM_FIRE_BOLT"
              className={`w-full h-9 px-3 rounded-xl bg-background border font-mono text-xs text-foreground outline-none transition-colors ${
                existingSkillByName ? 'border-destructive text-destructive' : 'border-border/80 focus:border-pastel-blue/60'
              }`}
              required
            />
            {existingSkillByName && (
              <span className="text-[10px] text-destructive font-mono">
                AegisName &quot;{name}&quot; already in use by ID #{existingSkillByName.id}!
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">Skill Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advanced Fire Bolt"
              className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 text-xs text-foreground outline-none focus:border-pastel-blue/60 transition-colors"
            />
          </div>

          {/* MaxLevel, Type, TargetType */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Max Level</label>
              <input
                type="number"
                value={maxLevel}
                onChange={(e) => setMaxLevel(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-background border border-border/80 font-mono text-xs text-foreground outline-none focus:border-pastel-blue/60 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Type</label>
              <Select value={type} onValueChange={(val) => setType(val as SkillType)}>
                <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
              <label className="text-[11px] font-medium text-foreground">Target</label>
              <Select value={targetType} onValueChange={(val) => setTargetType(val as SkillTargetType)}>
                <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
          <div className="space-y-1 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-foreground">Target File / Layer</label>
              <span className="text-[10px] text-pastel-blue font-mono font-medium">
                {targetLayerId === 'skill-db-import' ? 'Default: Import' : 'Direct Layer'}
              </span>
            </div>
            <Select value={targetLayerId} onValueChange={setTargetLayerId}>
              <SelectTrigger className="h-9 text-xs font-mono border-border/80 bg-background text-foreground rounded-xl">
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
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-1.5 bg-pastel-blue/20 text-pastel-blue border border-pastel-blue/30 hover:bg-pastel-blue/30 disabled:opacity-40 font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
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
