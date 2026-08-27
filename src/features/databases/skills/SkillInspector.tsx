import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useSkillEditStore } from '@/stores/skillEditStore';
import { SkillDatabaseValidator } from '@/services/database/skillDatabaseValidator';
import { SkillDatabaseSerializer } from '@/services/database/skill/skillDatabaseSerializer';
import { SkillEditTransactionService } from '@/services/database/skillEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Undo2, Redo2, Layers, Sliders, Clock, ShieldAlert, Crosshair } from 'lucide-react';
import { SkillIdentitySection } from './inspector/SkillIdentitySection';
import { SkillTimingSection } from './inspector/SkillTimingSection';
import { SkillRequirementsSection } from './inspector/SkillRequirementsSection';
import { SkillAreaUnitSection } from './inspector/SkillAreaUnitSection';
import { LayeredSkillRepository } from '@/services/database/skill/layeredSkillRepository';
import { SkillDatabaseProvider } from '@/services/database/providers/skillDatabaseProvider';
import { SkillFieldOrigin } from '@/domain/database/skill/effectiveSkill';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';

type SkillInspectorTab = 'general' | 'timings' | 'requirements' | 'area' | 'provenance';

export function SkillInspector({ skillId }: { skillId: number }) {
  const [currentTab, setCurrentTab] = useState<SkillInspectorTab>('general');
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('skill'));

  const {
    currentSession,
    startSession,
    cancelSession,
    reset,
    undo,
    redo,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useSkillEditStore();

  const skill = useMemo(() => {
    if (!provider) return null;
    const repo = provider.getRepository() as LayeredSkillRepository | undefined;
    return repo?.findById ? repo.findById(skillId) : null;
  }, [provider, skillId]);

  useEffect(() => {
    if (skill) {
      startSession(skill);
    } else {
      cancelSession();
    }
  }, [skill?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const transactionService = useMemo(() => {
    const validator = new SkillDatabaseValidator();
    const serializer = new SkillDatabaseSerializer();
    const writer = new TauriFileContentWriter(activeWorkspace?.rootPath || '');
    return new SkillEditTransactionService(validator, serializer, writer);
  }, [activeWorkspace?.rootPath]);

  // Run validation on changes
  useEffect(() => {
    if (!currentSession) {
      setValidationIssues([]);
      return;
    }
    const issues = transactionService.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, transactionService, setValidationIssues]);

  if (!skill || !currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
        Select a skill to view and edit properties.
      </div>
    );
  }

  const pendingChanges = currentSession.getPendingChanges();
  const fields = skill.fields;
  const isDirty = currentSession.isDirty;
  const { layerProvenance } = skill;

  const handleCommit = async () => {
    if (!provider || !currentSession || isCommitting) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      await transactionService.commitSession(currentSession, provider as unknown as SkillDatabaseProvider);
    } catch (e) {
      setCommitError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCommitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    } else if (
      (e.ctrlKey && e.key.toLowerCase() === 'y') ||
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault();
      redo();
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#141416] outline-none select-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-neutral-100 leading-tight">
              {fields.Description || skill.name}
            </div>
            <div className="text-xs font-mono text-sky-400 mt-0.5">{skill.name}</div>
          </div>
          <div className="flex items-center gap-1.5">
            {fields.Type && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30">
                {fields.Type}
              </span>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400 border border-[#27272a]">
              #{skill.id}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('general')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'general'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General &amp; Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('timings')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'timings'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timings &amp; Delays</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('requirements')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'requirements'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Requirements &amp; Costs</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('area')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'area'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Area &amp; Units</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('provenance')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentTab === 'provenance'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Semantic Diff Preview */}
        {isDirty && (
          <SemanticDiffViewer
            original={fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Skill Changes"
          />
        )}

        {currentTab === 'general' && <SkillIdentitySection skill={skill} />}
        {currentTab === 'timings' && <SkillTimingSection skill={skill} />}
        {currentTab === 'requirements' && <SkillRequirementsSection skill={skill} />}
        {currentTab === 'area' && <SkillAreaUnitSection skill={skill} />}

        {currentTab === 'provenance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Layer Hierarchy &amp; File Provenance
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                {layerProvenance.length} layer{layerProvenance.length > 1 ? 's' : ''} loaded
              </span>
            </div>

            <div className="space-y-2.5">
              {layerProvenance.map((layerId: string, idx: number) => {
                const repository = provider ? (provider.getRepository() as LayeredSkillRepository | undefined) : undefined;
                const layerData = repository?.getLayer ? repository.getLayer(layerId) : undefined;
                const relativePath =
                  layerData?.layer.relativePath ||
                  (Object.values(skill.fieldOrigins) as SkillFieldOrigin[]).find((o: SkillFieldOrigin) => o.layerId === layerId)?.filePath ||
                  layerId;
                const layerName = layerData?.layer.name || layerId;
                const isFinalLayer = idx === layerProvenance.length - 1;
                const isBaseLayer = idx === 0;

                const contributingFields = (Object.entries(skill.fieldOrigins) as [string, SkillFieldOrigin][])
                  .filter(([_, origin]: [string, SkillFieldOrigin]) => origin.layerId === layerId)
                  .map(([fieldName]) => fieldName);

                return (
                  <div
                    key={layerId}
                    className={`p-3 rounded border transition-colors ${
                      isFinalLayer
                        ? 'bg-sky-950/20 border-sky-500/30'
                        : 'bg-[#1f1f23] border-[#27272a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-medium ${
                            isFinalLayer ? 'bg-sky-600 text-white' : 'bg-[#27272a] text-neutral-400'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold text-neutral-100">{relativePath}</div>
                          <div className="text-[11px] text-neutral-400">{layerName}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
                          relativePath.includes('import')
                            ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                            : isBaseLayer
                            ? 'bg-[#141416] text-neutral-400 border-[#27272a]'
                            : 'bg-sky-950/60 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {relativePath.includes('import')
                          ? 'Import Override'
                          : isBaseLayer
                          ? 'Base Layer'
                          : 'Mode Layer'}
                      </span>
                    </div>

                    {contributingFields.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#27272a]/60">
                        <div className="text-[10px] text-neutral-500 mb-1">
                          Active fields from this file ({contributingFields.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {contributingFields.map((f) => (
                            <span
                              key={f}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141416] text-neutral-300 border border-[#27272a]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-[#27272a] bg-[#1f1f23] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`p-1.5 rounded ${
              currentSession.canUndo ? 'text-neutral-300 hover:bg-[#27272a]' : 'text-neutral-600 cursor-not-allowed'
            }`}
            onClick={undo}
            disabled={!currentSession.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-1.5 rounded ${
              currentSession.canRedo ? 'text-neutral-300 hover:bg-[#27272a]' : 'text-neutral-600 cursor-not-allowed'
            }`}
            onClick={redo}
            disabled={!currentSession.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {commitError && <div className="text-xs text-red-400 font-mono truncate max-w-xs">{commitError}</div>}
          <button
            type="button"
            disabled={!isDirty || isCommitting}
            onClick={reset}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!isDirty || isCommitting || validationIssues.some((i) => i.severity === 'error')}
            onClick={handleCommit}
            className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-sky-600 transition-colors shadow-sm"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
