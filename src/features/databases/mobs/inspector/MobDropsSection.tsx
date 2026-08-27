import { useMobEditStore } from '@/stores/mobEditStore';
import { EffectiveMob } from '@/domain/database/mob/effectiveMob';
import { MobDrop, MobMvpDrop } from '@/domain/database/mob/mobTypes';
import { Plus, Trash2, Shield, Gift, Sparkles } from 'lucide-react';

interface MobDropsSectionProps {
  mob: EffectiveMob;
}

export function MobDropsSection({ mob }: MobDropsSectionProps) {
  const { currentSession, setField } = useMobEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = mob.fields;

  const currentDrops: MobDrop[] = (pendingChanges.Drops !== undefined ? pendingChanges.Drops : fields.Drops) || [];
  const currentMvpDrops: MobMvpDrop[] = (pendingChanges.MvpDrops !== undefined ? pendingChanges.MvpDrops : fields.MvpDrops) || [];

  const updateDrop = (index: number, updatedDrop: Partial<MobDrop>) => {
    const list = [...currentDrops];
    list[index] = { ...list[index], ...updatedDrop };
    setField('Drops', list);
  };

  const removeDrop = (index: number) => {
    const list = currentDrops.filter((_, i) => i !== index);
    setField('Drops', list.length > 0 ? list : undefined);
  };

  const addDrop = () => {
    const list = [...currentDrops, { Item: '', Rate: 1000 }];
    setField('Drops', list);
  };

  const updateMvpDrop = (index: number, updatedDrop: Partial<MobMvpDrop>) => {
    const list = [...currentMvpDrops];
    list[index] = { ...list[index], ...updatedDrop };
    setField('MvpDrops', list);
  };

  const removeMvpDrop = (index: number) => {
    const list = currentMvpDrops.filter((_, i) => i !== index);
    setField('MvpDrops', list.length > 0 ? list : undefined);
  };

  const addMvpDrop = () => {
    const list = [...currentMvpDrops, { Item: '', Rate: 5000 }];
    setField('MvpDrops', list);
  };

  const formatRate = (rate: number): string => {
    return `${(rate / 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-3.5">
      {/* Normal Drops Section */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-sky-400" />
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Standard Item Drops ({currentDrops.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={addDrop}
            className="flex items-center gap-1 text-[11px] font-mono bg-sky-600 hover:bg-sky-500 text-white px-2 py-0.5 rounded transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" /> Add Drop
          </button>
        </div>

        {currentDrops.length === 0 ? (
          <div className="p-3 text-center text-xs text-neutral-400 bg-[#141416] rounded border border-dashed border-[#27272a] font-mono flex flex-col items-center gap-2">
            <span>No standard drops defined for this monster.</span>
            <button
              type="button"
              onClick={addDrop}
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-sans"
            >
              <Plus className="w-3.5 h-3.5" /> Click to add first drop
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentDrops.map((drop, idx) => (
              <div
                key={`drop-${idx}`}
                className="flex items-center gap-1.5 p-1.5 rounded bg-[#141416] border border-[#27272a] hover:border-neutral-600 transition-colors"
              >
                <div className="w-5 text-center text-[10px] font-mono text-neutral-500 shrink-0">#{idx + 1}</div>

                {/* Item Name Input */}
                <input
                  type="text"
                  value={drop.Item || ''}
                  placeholder="Item AegisName (e.g. Jellopy)"
                  onChange={(e) => updateDrop(idx, { Item: e.target.value })}
                  className="flex-1 min-w-0 text-xs font-mono bg-[#1f1f23] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200 focus:border-sky-500/50 outline-none"
                  autoFocus={drop.Item === ''}
                />

                {/* Rate Input */}
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={drop.Rate === undefined || drop.Rate === null ? '' : String(drop.Rate)}
                    placeholder="Rate"
                    onChange={(e) => updateDrop(idx, { Rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-16 text-xs font-mono text-right bg-[#1f1f23] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200 focus:border-sky-500/50 outline-none"
                  />
                  <span className="w-12 text-[10px] font-mono text-sky-400 text-right">
                    {formatRate(drop.Rate || 0)}
                  </span>
                </div>

                {/* Steal Protected Toggle */}
                <button
                  type="button"
                  onClick={() => updateDrop(idx, { StealProtected: !drop.StealProtected })}
                  className={`p-1 rounded transition-colors border shrink-0 ${
                    drop.StealProtected
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                      : 'bg-[#1f1f23] text-neutral-500 border-[#27272a] hover:text-neutral-300'
                  }`}
                  title={drop.StealProtected ? 'Steal Protected (Cannot be stolen)' : 'Can be stolen (TF_STEAL)'}
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeDrop(idx)}
                  className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors shrink-0"
                  title="Remove Drop"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addDrop}
              className="w-full py-1 text-[11px] font-mono text-neutral-400 hover:text-sky-300 bg-[#141416] hover:bg-[#1f1f23] border border-dashed border-[#27272a] rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Another Drop
            </button>
          </div>
        )}
      </div>

      {/* MVP Prize Drops Section */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              MVP Prize Rewards ({currentMvpDrops.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={addMvpDrop}
            className="flex items-center gap-1 text-[11px] font-mono bg-amber-600 hover:bg-amber-500 text-white px-2 py-0.5 rounded transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" /> Add MVP Drop
          </button>
        </div>

        {currentMvpDrops.length === 0 ? (
          <div className="p-3 text-center text-xs text-neutral-400 bg-[#141416] rounded border border-dashed border-[#27272a] font-mono flex flex-col items-center gap-2">
            <span>No MVP prize rewards defined (Applicable for Boss/MVP monsters).</span>
            <button
              type="button"
              onClick={addMvpDrop}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-sans"
            >
              <Plus className="w-3.5 h-3.5" /> Click to add MVP reward
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentMvpDrops.map((drop, idx) => (
              <div
                key={`mvp-drop-${idx}`}
                className="flex items-center gap-1.5 p-1.5 rounded bg-[#141416] border border-amber-500/20 hover:border-amber-500/40 transition-colors"
              >
                <div className="w-5 text-center text-[10px] font-mono text-amber-400/80 shrink-0">#{idx + 1}</div>

                <input
                  type="text"
                  value={drop.Item || ''}
                  placeholder="MVP Item AegisName (e.g. Old_Blue_Box)"
                  onChange={(e) => updateMvpDrop(idx, { Item: e.target.value })}
                  className="flex-1 min-w-0 text-xs font-mono bg-[#1f1f23] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200 focus:border-amber-500/50 outline-none"
                  autoFocus={drop.Item === ''}
                />

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={drop.Rate === undefined || drop.Rate === null ? '' : String(drop.Rate)}
                    placeholder="Rate"
                    onChange={(e) => updateMvpDrop(idx, { Rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-16 text-xs font-mono text-right bg-[#1f1f23] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200 focus:border-amber-500/50 outline-none"
                  />
                  <span className="w-12 text-[10px] font-mono text-amber-400 text-right">
                    {formatRate(drop.Rate || 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeMvpDrop(idx)}
                  className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors shrink-0"
                  title="Remove MVP Drop"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addMvpDrop}
              className="w-full py-1 text-[11px] font-mono text-neutral-400 hover:text-amber-300 bg-[#141416] hover:bg-[#1f1f23] border border-dashed border-[#27272a] rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Another MVP Drop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
