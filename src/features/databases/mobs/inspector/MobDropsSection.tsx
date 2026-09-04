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
    <div className="space-y-4">
      {/* Normal Drops Section */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-pastel-blue" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Standard Item Drops ({currentDrops.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={addDrop}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Drop
          </button>
        </div>

        {currentDrops.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border/80 font-mono flex flex-col items-center gap-2">
            <span>No standard drops defined for this monster.</span>
            <button
              type="button"
              onClick={addDrop}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-sans font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Click to add first drop
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {currentDrops.map((drop, idx) => (
              <div
                key={`drop-${idx}`}
                className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/80 hover:border-border transition-colors shadow-2xs"
              >
                <div className="w-6 text-center text-xs font-mono text-muted-foreground shrink-0">#{idx + 1}</div>

                {/* Item Name Input */}
                <input
                  type="text"
                  value={drop.Item || ''}
                  placeholder="Item AegisName (e.g. Jellopy)"
                  onChange={(e) => updateDrop(idx, { Item: e.target.value })}
                  className="flex-1 min-w-0 text-xs font-mono bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
                  autoFocus={drop.Item === ''}
                />

                {/* Rate Input */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={drop.Rate === undefined || drop.Rate === null ? '' : String(drop.Rate)}
                    placeholder="Rate"
                    onChange={(e) => updateDrop(idx, { Rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-20 text-xs font-mono text-right bg-background border border-border/80 rounded-lg px-2.5 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
                  />
                  <span className="w-14 text-xs font-mono text-pastel-blue text-right font-medium">
                    {formatRate(drop.Rate || 0)}
                  </span>
                </div>

                {/* Steal Protected Toggle */}
                <button
                  type="button"
                  onClick={() => updateDrop(idx, { StealProtected: !drop.StealProtected })}
                  className={`p-2 rounded-lg transition-colors border shrink-0 ${
                    drop.StealProtected
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                      : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                  }`}
                  title={drop.StealProtected ? 'Steal Protected (Cannot be stolen)' : 'Can be stolen (TF_STEAL)'}
                >
                  <Shield className="w-4 h-4" />
                </button>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeDrop(idx)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Remove Drop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addDrop}
              className="w-full py-2 text-xs font-mono text-muted-foreground hover:text-primary bg-secondary/40 hover:bg-secondary/70 border border-dashed border-border/80 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Drop
            </button>
          </div>
        )}
      </div>

      {/* MVP Prize Drops Section */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pastel-amber" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              MVP Prize Rewards ({currentMvpDrops.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={addMvpDrop}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add MVP Drop
          </button>
        </div>

        {currentMvpDrops.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border/80 font-mono flex flex-col items-center gap-2">
            <span>No MVP prize rewards defined (Applicable for Boss/MVP monsters).</span>
            <button
              type="button"
              onClick={addMvpDrop}
              className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300 hover:underline font-sans font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Click to add MVP reward
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {currentMvpDrops.map((drop, idx) => (
              <div
                key={`mvp-drop-${idx}`}
                className="flex items-center gap-2 p-2 rounded-xl bg-card border border-amber-500/30 hover:border-amber-500/50 transition-colors shadow-2xs"
              >
                <div className="w-6 text-center text-xs font-mono text-amber-600 dark:text-amber-300 shrink-0">#{idx + 1}</div>

                <input
                  type="text"
                  value={drop.Item || ''}
                  placeholder="MVP Item AegisName (e.g. Old_Blue_Box)"
                  onChange={(e) => updateMvpDrop(idx, { Item: e.target.value })}
                  className="flex-1 min-w-0 text-xs font-mono bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-amber-500/50 outline-none"
                  autoFocus={drop.Item === ''}
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={drop.Rate === undefined || drop.Rate === null ? '' : String(drop.Rate)}
                    placeholder="Rate"
                    onChange={(e) => updateMvpDrop(idx, { Rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-20 text-xs font-mono text-right bg-background border border-border/80 rounded-lg px-2.5 py-1.5 h-9 text-foreground focus:border-amber-500/50 outline-none"
                  />
                  <span className="w-14 text-xs font-mono text-amber-600 dark:text-amber-300 text-right font-medium">
                    {formatRate(drop.Rate || 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeMvpDrop(idx)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Remove MVP Drop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addMvpDrop}
              className="w-full py-2 text-xs font-mono text-muted-foreground hover:text-amber-500 bg-secondary/40 hover:bg-secondary/70 border border-dashed border-border/80 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another MVP Drop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
