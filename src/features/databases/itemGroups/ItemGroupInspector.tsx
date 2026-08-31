import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useItemGroupEditStore } from '@/stores/itemGroupEditStore';
import { EffectiveItemGroup } from '@/domain/database/itemGroup/effectiveItemGroup';
import { SemanticDiffViewer } from '../common/SemanticDiffViewer';
import { ItemGroupDatabaseValidator } from '@/services/database/itemGroup/itemGroupDatabaseValidator';
import { ItemGroupDatabaseSerializer } from '@/services/database/itemGroup/itemGroupDatabaseSerializer';
import { ItemGroupEditTransactionService } from '@/services/database/itemGroupEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2, Undo2, Redo2, Layers, Plus, Trash2, FolderPlus } from 'lucide-react';
import { LayeredItemGroupRepository } from '@/services/database/itemGroup/layeredItemGroupRepository';
import { ItemGroupDatabaseProvider } from '@/services/database/providers/itemGroupDatabaseProvider';
import { Input } from '@/components/ui/input';
import { ItemGroupEntry, ItemSubGroup, getItemGroupAllEntries } from '@/domain/database/itemGroup/itemGroupTypes';

type InspectorTab = 'items' | 'identity' | 'layers';

const BOUND_OPTIONS = ['None', 'Account', 'Guild', 'Party', 'Character'] as const;

interface ItemGroupEntryCardProps {
  entry: ItemGroupEntry;
  index: number;
  totalInList: number;
  onChange: (patch: Partial<ItemGroupEntry>) => void;
  onRemove: () => void;
}

function ItemGroupEntryCard({ entry, index, totalInList, onChange, onRemove }: ItemGroupEntryCardProps) {
  return (
    <div className="p-3 rounded bg-[#1f1f23] border border-[#27272a] space-y-2.5 text-xs">
      {/* Top Row: Index + Item + Remove */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-neutral-500 w-5 shrink-0">#{index + 1}</span>
        <div className="flex-1 min-w-0">
          <Input
            value={String(entry.Item ?? '')}
            onChange={(e) => onChange({ Item: e.target.value })}
            placeholder="Item AegisName or ID"
            className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
        <div className="w-20 shrink-0">
          <Input
            type="number"
            value={entry.Index ?? ''}
            onChange={(e) => onChange({ Index: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Index"
            title="Explicit Index (optional)"
            className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono text-center"
          />
        </div>
        {totalInList > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-neutral-500 hover:text-red-400 shrink-0 rounded hover:bg-[#27272a]"
            title="Remove item entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row 2: Rate, Amount, Duration, RandomOptionGroup */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Rate</label>
          <Input
            type="number"
            value={entry.Rate ?? 0}
            onChange={(e) => onChange({ Rate: Number(e.target.value) })}
            placeholder="0"
            className="h-7 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Amount</label>
          <Input
            type="number"
            value={entry.Amount ?? 1}
            onChange={(e) => onChange({ Amount: Number(e.target.value) })}
            placeholder="1"
            className="h-7 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Duration (min)</label>
          <Input
            type="number"
            value={entry.Duration ?? 0}
            onChange={(e) => onChange({ Duration: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            className="h-7 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Random Option Group</label>
          <Input
            value={entry.RandomOptionGroup ?? ''}
            onChange={(e) => onChange({ RandomOptionGroup: e.target.value || undefined })}
            placeholder="e.g. ROPTG_PHYSICAL"
            className="h-7 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
      </div>

      {/* Row 3: Refine Min/Max & Bound */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Refine Min</label>
          <Input
            type="number"
            min={0}
            max={20}
            value={entry.RefineMinimum ?? 0}
            onChange={(e) => onChange({ RefineMinimum: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            className="h-7 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Refine Max</label>
          <Input
            type="number"
            min={0}
            max={20}
            value={entry.RefineMaximum ?? 0}
            onChange={(e) => onChange({ RefineMaximum: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            className="h-7 bg-[#141416] border-[#27272a] text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 block mb-1">Bound</label>
          <select
            value={String(entry.Bound ?? 'None')}
            onChange={(e) => onChange({ Bound: e.target.value === 'None' ? undefined : e.target.value })}
            className="w-full h-7 bg-[#141416] border border-[#27272a] rounded px-2 text-xs font-mono text-neutral-200 outline-none focus:border-sky-500"
          >
            {BOUND_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Flags */}
      <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-[#27272a]/60">
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
          <input
            type="checkbox"
            checked={!!(entry.Announced ?? entry.Announce)}
            onChange={(e) => onChange({ Announced: e.target.checked ? true : undefined, Announce: undefined })}
            className="rounded border-[#27272a] bg-[#141416] text-sky-600 focus:ring-0 w-3.5 h-3.5"
          />
          <span>Announced</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
          <input
            type="checkbox"
            checked={!!entry.UniqueId}
            onChange={(e) => onChange({ UniqueId: e.target.checked ? true : undefined })}
            className="rounded border-[#27272a] bg-[#141416] text-sky-600 focus:ring-0 w-3.5 h-3.5"
          />
          <span>UniqueId</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
          <input
            type="checkbox"
            checked={entry.Stacked !== false}
            onChange={(e) => onChange({ Stacked: e.target.checked ? undefined : false })}
            className="rounded border-[#27272a] bg-[#141416] text-sky-600 focus:ring-0 w-3.5 h-3.5"
          />
          <span>Stacked</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
          <input
            type="checkbox"
            checked={!!entry.Named}
            onChange={(e) => onChange({ Named: e.target.checked ? true : undefined })}
            className="rounded border-[#27272a] bg-[#141416] text-sky-600 focus:ring-0 w-3.5 h-3.5"
          />
          <span>Named</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
          <input
            type="checkbox"
            checked={!!entry.Clear}
            onChange={(e) => onChange({ Clear: e.target.checked ? true : undefined })}
            className="rounded border-[#27272a] bg-[#141416] text-sky-600 focus:ring-0 w-3.5 h-3.5"
          />
          <span>Clear</span>
        </label>
      </div>
    </div>
  );
}

export function ItemGroupInspector({ groupKey }: { groupKey: string }) {
  const [currentTab, setCurrentTab] = useState<InspectorTab>('items');
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const provider = useDatabaseStore((s) => s.registry?.getProvider('group'));

  const {
    currentSession,
    startSession,
    cancelSession,
    undo,
    redo,
    setField,
    validationIssues,
    setValidationIssues,
    commitError,
    setCommitError,
    isCommitting,
    setIsCommitting,
  } = useItemGroupEditStore();

  const group: EffectiveItemGroup | undefined = useMemo(() => {
    if (!provider || !groupKey) return undefined;
    const repository = provider.getRepository() as LayeredItemGroupRepository | undefined;
    if (!repository || typeof repository.findByKey !== 'function') return undefined;
    return repository.findByKey(groupKey);
  }, [provider, groupKey]);

  useEffect(() => {
    if (group) {
      startSession(group);
    } else {
      cancelSession();
    }
  }, [group, startSession, cancelSession]);

  useEffect(() => {
    if (!currentSession) return;
    const validator = new ItemGroupDatabaseValidator();
    const service = new ItemGroupEditTransactionService(validator, new ItemGroupDatabaseSerializer(), {
      writeFile: async () => {},
    });
    const issues = service.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, setValidationIssues]);

  if (!group || !currentSession) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Item Group not found
      </div>
    );
  }

  const { layerProvenance } = group;
  const effectiveFields = currentSession.getEffectiveFields();
  const pendingChanges = currentSession.getPendingChanges();

  const handleSave = async () => {
    if (!activeWorkspace || !provider) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const validator = new ItemGroupDatabaseValidator();
      const serializer = new ItemGroupDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemGroupEditTransactionService(validator, serializer, writer);

      await service.commitSession(currentSession, provider as unknown as ItemGroupDatabaseProvider);

      const repo = provider.getRepository() as LayeredItemGroupRepository | undefined;
      const updated = repo?.findByKey(groupKey);
      if (updated) {
        startSession(updated);
      }
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

  const totalItemsCount = getItemGroupAllEntries(effectiveFields).length;

  const handleAddDirectEntry = () => {
    const list: ItemGroupEntry[] = [...(effectiveFields.List || []), { Item: 'Red_Potion', Rate: 10000, Amount: 1 }];
    setField('List', list);
  };

  const handleRemoveDirectEntry = (idx: number) => {
    if ((effectiveFields.List || []).length <= 1) return;
    const list = (effectiveFields.List || []).filter((_, i) => i !== idx);
    setField('List', list);
  };

  const handleDirectEntryChange = (idx: number, patch: Partial<ItemGroupEntry>) => {
    const list: ItemGroupEntry[] = (effectiveFields.List || []).map((entry, i) =>
      i === idx ? { ...entry, ...patch } : entry
    );
    setField('List', list);
  };

  const handleSubGroupEntryChange = (sgIdx: number, itemIdx: number, patch: Partial<ItemGroupEntry>) => {
    const currentSubGroups = effectiveFields.SubGroups || [];
    const subGroups: ItemSubGroup[] = currentSubGroups.map((sg, sIdx) => {
      if (sIdx !== sgIdx) return sg;
      const list = sg.List.map((item, iIdx) => (iIdx === itemIdx ? { ...item, ...patch } : item));
      return { ...sg, List: list };
    });
    setField('SubGroups', subGroups);
  };

  const handleAddSubGroupEntry = (sgIdx: number) => {
    const currentSubGroups = effectiveFields.SubGroups && effectiveFields.SubGroups.length > 0
      ? [...effectiveFields.SubGroups]
      : [{ SubGroup: 1, List: [] }];

    const subGroups: ItemSubGroup[] = currentSubGroups.map((sg, sIdx) => {
      if (sIdx !== sgIdx) return sg;
      const list = [...(sg.List || []), { Item: 'Red_Potion', Rate: 10000, Amount: 1 }];
      return { ...sg, List: list };
    });
    setField('SubGroups', subGroups);
  };

  const handleRemoveSubGroupEntry = (sgIdx: number, itemIdx: number) => {
    if (!effectiveFields.SubGroups) return;
    const subGroups: ItemSubGroup[] = effectiveFields.SubGroups.map((sg, sIdx) => {
      if (sIdx !== sgIdx) return sg;
      const list = sg.List.filter((_, iIdx) => iIdx !== itemIdx);
      return { ...sg, List: list };
    });
    setField('SubGroups', subGroups);
  };

  const handleAddSubGroup = () => {
    const currentSubGroups = effectiveFields.SubGroups ? [...effectiveFields.SubGroups] : [];
    const maxSubGroupId = currentSubGroups.reduce((max, sg) => Math.max(max, sg.SubGroup), -1);
    const nextSubGroupId = maxSubGroupId === -1 ? 0 : maxSubGroupId + 1;
    const newSubGroup: ItemSubGroup = {
      SubGroup: nextSubGroupId,
      List: [{ Item: 'Red_Potion', Rate: 10000, Amount: 1 }],
    };
    setField('SubGroups', [...currentSubGroups, newSubGroup]);
  };

  const handleRemoveSubGroup = (sgIdx: number) => {
    if (!effectiveFields.SubGroups || effectiveFields.SubGroups.length <= 1) return;
    const subGroups = effectiveFields.SubGroups.filter((_, sIdx) => sIdx !== sgIdx);
    setField('SubGroups', subGroups);
  };

  const handleSubGroupHeaderChange = (sgIdx: number, patch: Partial<ItemSubGroup>) => {
    if (!effectiveFields.SubGroups) return;
    const subGroups = effectiveFields.SubGroups.map((sg, sIdx) =>
      sIdx === sgIdx ? { ...sg, ...patch } : sg
    );
    setField('SubGroups', subGroups);
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
            <div className="text-base font-bold text-neutral-100 font-mono leading-tight">
              {group.group}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              {totalItemsCount} Drop Entries
              {group.subGroup !== undefined && ` • SubGroup ${group.subGroup}`}
              {effectiveFields.SubGroups && ` • ${effectiveFields.SubGroups.length} SubGroups`}
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141416] text-emerald-400 border border-[#27272a] flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>GROUP</span>
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-3.5 border-t border-[#27272a]/60 pt-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('items')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'items'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Group Items ({totalItemsCount})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('identity')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'identity'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Identity
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('layers')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === 'layers'
                ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Layers
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {currentSession.isDirty && (
          <SemanticDiffViewer
            original={group.fields as Record<string, unknown>}
            pending={pendingChanges as Record<string, unknown>}
            title="Unsaved Group Changes"
          />
        )}

        {commitError && (
          <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400 break-all">
            {commitError}
          </div>
        )}

        {currentTab === 'items' && (
          <div className="space-y-4">
            {effectiveFields.SubGroups && effectiveFields.SubGroups.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Configured SubGroups ({effectiveFields.SubGroups.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSubGroup}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-[#1f1f23] px-2.5 py-1 rounded border border-[#27272a]"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Add SubGroup</span>
                  </button>
                </div>

                {effectiveFields.SubGroups.map((sg, sgIdx) => (
                  <div key={sgIdx} className="space-y-3 bg-[#18181b] p-3.5 rounded border border-[#27272a]">
                    <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-200">SubGroup #</span>
                          <Input
                            type="number"
                            value={sg.SubGroup}
                            onChange={(e) => handleSubGroupHeaderChange(sgIdx, { SubGroup: Number(e.target.value) })}
                            className="h-6 w-14 bg-[#141416] border-[#27272a] text-xs font-mono text-center"
                          />
                        </div>
                        {sg.SubGroup === 0 && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                            Always Obtained
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          ({sg.List.length} items)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddSubGroupEntry(sgIdx)}
                          className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 bg-[#1f1f23] px-2 py-1 rounded border border-[#27272a]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                        {effectiveFields.SubGroups && effectiveFields.SubGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubGroup(sgIdx)}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-[#27272a]"
                            title="Remove SubGroup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {sg.List.map((entry, idx) => (
                        <ItemGroupEntryCard
                          key={idx}
                          entry={entry}
                          index={idx}
                          totalInList={sg.List.length}
                          onChange={(patch) => handleSubGroupEntryChange(sgIdx, idx, patch)}
                          onRemove={() => handleRemoveSubGroupEntry(sgIdx, idx)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Item Drop Entries
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddDirectEntry}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 bg-[#1f1f23] px-2.5 py-1 rounded border border-[#27272a]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item Entry</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSubGroup}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-[#1f1f23] px-2.5 py-1 rounded border border-[#27272a]"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Convert to SubGroups</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(effectiveFields.List || []).map((entry, idx) => (
                    <ItemGroupEntryCard
                      key={idx}
                      entry={entry}
                      index={idx}
                      totalInList={(effectiveFields.List || []).length}
                      onChange={(patch) => handleDirectEntryChange(idx, patch)}
                      onRemove={() => handleRemoveDirectEntry(idx)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'identity' && (
          <div className="space-y-3 bg-[#1f1f23] p-3.5 rounded border border-[#27272a]">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Group Identity
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Group Name / ID</label>
                <Input
                  value={effectiveFields.Group || ''}
                  onChange={(e) => setField('Group', e.target.value)}
                  className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">SubGroup</label>
                <Input
                  type="number"
                  value={effectiveFields.SubGroup ?? ''}
                  onChange={(e) => setField('SubGroup', e.target.value ? Number(e.target.value) : undefined)}
                  className="h-8 bg-[#141416] border-[#27272a] text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'layers' && (
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Layer Hierarchy
            </h3>
            {layerProvenance.map((layerId, idx) => (
              <div
                key={layerId}
                className="p-3 rounded border border-[#27272a] bg-[#1f1f23] flex items-center justify-between text-xs font-mono"
              >
                <span>{layerId}</span>
                <span className="text-[10px] text-neutral-400">Order: {idx + 1}</span>
              </div>
            ))}
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
          <button
            type="button"
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            onClick={() => {
              cancelSession();
              startSession(group);
            }}
            disabled={!currentSession.isDirty || isCommitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 ${
              currentSession.isDirty && validationIssues.length === 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
            }`}
            onClick={handleSave}
            disabled={!currentSession.isDirty || validationIssues.length > 0 || isCommitting}
          >
            {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
