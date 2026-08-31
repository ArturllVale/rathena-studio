import { useMemo, useEffect } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useRandomOptEditStore } from '@/stores/randomOptEditStore';
import { EffectiveRandomOption, EffectiveRandomOptionGroup } from '@/domain/database/randomOpt/effectiveRandomOpt';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { RandomOptDatabaseValidator } from '@/services/database/randomOpt/randomOptDatabaseValidator';
import { RandomOptDatabaseSerializer } from '@/services/database/randomOpt/randomOptDatabaseSerializer';
import { RandomOptEditTransactionService } from '@/services/database/randomOptEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Dices, Layers } from 'lucide-react';
import { LayeredRandomOptRepository } from '@/services/database/randomOpt/layeredRandomOptRepository';
import { RandomOptDatabaseProvider } from '@/services/database/providers/randomOptDatabaseProvider';
import { Input } from '@/components/ui/input';

export function RandomOptionInspector({
  optionId,
  groupId,
}: {
  optionId?: number | null;
  groupId?: number | null;
}) {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('randomopt'));

  const {
    currentOptionSession,
    currentGroupSession,
    startOptionSession,
    startGroupSession,
    cancelSession,
    setOptionField,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useRandomOptEditStore();

  const repo = useMemo(() => {
    if (!provider) return undefined;
    return provider.getRepository() as LayeredRandomOptRepository | undefined;
  }, [provider]);

  const option: EffectiveRandomOption | undefined = useMemo(() => {
    if (!repo || !optionId) return undefined;
    return repo.findOptionById(optionId);
  }, [repo, optionId]);

  const group: EffectiveRandomOptionGroup | undefined = useMemo(() => {
    if (!repo || !groupId) return undefined;
    return repo.findGroupById(groupId);
  }, [repo, groupId]);

  useEffect(() => {
    if (optionId && option) {
      startOptionSession(option);
    } else if (groupId && group) {
      startGroupSession(group);
    } else {
      cancelSession();
    }
  }, [optionId, groupId, option, group, startOptionSession, startGroupSession, cancelSession]);

  useEffect(() => {
    const validator = new RandomOptDatabaseValidator();
    const service = new RandomOptEditTransactionService(validator, new RandomOptDatabaseSerializer(), {
      writeFile: async () => {},
    });

    if (currentOptionSession) {
      const issues = service.validateOptionSession(currentOptionSession);
      setValidationIssues(issues);
    } else if (currentGroupSession) {
      const issues = service.validateGroupSession(currentGroupSession);
      setValidationIssues(issues);
    }
  }, [currentOptionSession, currentGroupSession, setValidationIssues]);

  if ((!option && !group) || (!currentOptionSession && !currentGroupSession)) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Select a random option or group to view details
      </div>
    );
  }

  const handleSaveOption = async () => {
    if (!activeWorkspace || !provider || !currentOptionSession) return;
    setIsCommitting(true);
    setCommitError(null);
    try {
      const validator = new RandomOptDatabaseValidator();
      const serializer = new RandomOptDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new RandomOptEditTransactionService(validator, serializer, writer);

      await service.commitOptionSession(currentOptionSession, provider as unknown as RandomOptDatabaseProvider);

      if (optionId && repo) {
        const updated = repo.findOptionById(optionId);
        if (updated) startOptionSession(updated);
      }
    } catch (e) {
      setCommitError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCommitting(false);
    }
  };

  if (currentOptionSession && option) {
    const effectiveFields = currentOptionSession.getEffectiveFields();
    return (
      <div className="flex flex-col h-full bg-[#141416] select-none">
        <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
                {option.option}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Random Option #{option.id}</div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-sky-400 border border-[#27272a] flex items-center gap-1">
              <Dices className="w-3 h-3" />
              <span>OPTION</span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {currentOptionSession.isDirty && (
            <SemanticDiffViewer
              original={option.fields as Record<string, unknown>}
              pending={currentOptionSession.getPendingChanges() as Record<string, unknown>}
              title="Unsaved Option Changes"
            />
          )}

          {commitError && (
            <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400">
              {commitError}
            </div>
          )}

          <div className="space-y-3 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Option Constant Name</label>
              <Input
                value={effectiveFields.Option || ''}
                onChange={(e) => setOptionField('Option', e.target.value)}
                className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Script</label>
              <textarea
                value={effectiveFields.Script || ''}
                onChange={(e) => setOptionField('Script', e.target.value)}
                rows={6}
                className="w-full bg-[#141416] border border-[#27272a] rounded p-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#27272a] bg-[#1f1f23] flex items-center justify-end gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 ${
              currentOptionSession.isDirty && validationIssues.length === 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
            }`}
            onClick={handleSaveOption}
            disabled={!currentOptionSession.isDirty || validationIssues.length > 0 || isCommitting}
          >
            {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  if (currentGroupSession && group) {
    const effectiveFields = currentGroupSession.getEffectiveFields();
    return (
      <div className="flex flex-col h-full bg-[#141416] select-none">
        <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
                {group.group}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Group #{group.id} • {effectiveFields.Slots.length} Slots
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-amber-400 border border-[#27272a] flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>GROUP</span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Configured Slots
            </h3>
            {effectiveFields.Slots.map((slot, sIdx) => (
              <div key={sIdx} className="p-3 rounded bg-[#1f1f23] border border-[#27272a] space-y-2 text-xs">
                <div className="font-semibold text-neutral-300">Slot #{slot.Slot} ({slot.Options.length} Options)</div>
                <div className="space-y-1.5">
                  {slot.Options.map((opt, oIdx) => (
                    <div key={oIdx} className="p-2 rounded bg-[#141416] border border-[#27272a] text-[11px] font-mono">
                      <div className="text-sky-300 font-medium">{opt.Option}</div>
                      <div className="text-neutral-500 mt-0.5">
                        Range: {opt.MinValue} ~ {opt.MaxValue} • Chance: {opt.Chance / 100}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
