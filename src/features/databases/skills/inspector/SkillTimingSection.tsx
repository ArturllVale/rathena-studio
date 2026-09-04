import { useState } from 'react';
import { useSkillEditStore } from '@/stores/skillEditStore';
import { EffectiveSkill } from '@/domain/database/skill/effectiveSkill';
import { SkillLevelTime } from '@/domain/database/skill/skillTypes';
import { Clock, Layers } from 'lucide-react';

interface SkillTimingSectionProps {
  skill: EffectiveSkill;
}

type TimingField =
  | 'CastTime'
  | 'FixedCastTime'
  | 'AfterCastActDelay'
  | 'AfterCastWalkDelay'
  | 'Duration1'
  | 'Duration2'
  | 'Cooldown';

const TIMING_FIELDS: { key: TimingField; label: string; desc: string }[] = [
  { key: 'CastTime', label: 'Variable Cast Time', desc: 'Cast time in milliseconds (affected by DEX/INT)' },
  { key: 'FixedCastTime', label: 'Fixed Cast Time', desc: 'Fixed cast duration in milliseconds' },
  { key: 'AfterCastActDelay', label: 'After Cast Action Delay', desc: 'Global cooldown / skill delay in ms' },
  { key: 'AfterCastWalkDelay', label: 'After Cast Walk Delay', desc: 'Walk lock duration in milliseconds' },
  { key: 'Duration1', label: 'Buff / Effect Duration 1', desc: 'Primary skill state duration in ms' },
  { key: 'Duration2', label: 'Debuff / Effect Duration 2', desc: 'Secondary skill state duration in ms' },
  { key: 'Cooldown', label: 'Skill Cooldown', desc: 'Individual cooldown before reuse in ms' },
];

export function SkillTimingSection({ skill }: SkillTimingSectionProps) {
  const { currentSession, setField } = useSkillEditStore();
  const [expandedMatrix, setExpandedMatrix] = useState<Record<string, boolean>>({});

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = skill.fields;
  const maxLevel = (pendingChanges.MaxLevel !== undefined ? pendingChanges.MaxLevel : fields.MaxLevel) || 10;

  const toggleMatrix = (key: string) => {
    setExpandedMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFieldValue = (key: TimingField): number | SkillLevelTime[] | undefined => {
    return pendingChanges[key] !== undefined ? pendingChanges[key] : fields[key];
  };

  const updateScalar = (key: TimingField, value: string) => {
    if (value === '') {
      setField(key, undefined);
    } else {
      setField(key, Number(value));
    }
  };

  const convertToMatrix = (key: TimingField) => {
    const currentVal = getFieldValue(key);
    const baseTime = typeof currentVal === 'number' ? currentVal : 1000;
    const matrix: SkillLevelTime[] = [];
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      matrix.push({ Level: lvl, Time: baseTime });
    }
    setField(key, matrix);
    setExpandedMatrix((prev) => ({ ...prev, [key]: true }));
  };

  const convertToScalar = (key: TimingField) => {
    const currentVal = getFieldValue(key);
    const firstTime = Array.isArray(currentVal) && currentVal.length > 0 ? currentVal[0].Time : 0;
    setField(key, firstTime > 0 ? firstTime : undefined);
    setExpandedMatrix((prev) => ({ ...prev, [key]: false }));
  };

  const updateMatrixLevel = (key: TimingField, levelIndex: number, newTime: number) => {
    const currentVal = getFieldValue(key);
    if (!Array.isArray(currentVal)) return;

    const updated = [...currentVal];
    updated[levelIndex] = { ...updated[levelIndex], Time: newTime };
    setField(key, updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-pastel-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Cast Times, Delays &amp; Durations (ms)
          </h3>
        </div>

        <div className="space-y-2.5">
          {TIMING_FIELDS.map(({ key, label, desc }) => {
            const rawVal = getFieldValue(key);
            const isMatrix = Array.isArray(rawVal);
            const isModified = pendingChanges[key] !== undefined;

            return (
              <div
                key={key}
                className="bg-accent/20 p-3 rounded-xl border border-border/70 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {isModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue shrink-0" />}
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isMatrix ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="0 ms"
                          value={rawVal === undefined || rawVal === null ? '' : String(rawVal)}
                          onChange={(e) => updateScalar(key, e.target.value)}
                          className={`w-24 sm:w-28 text-sm font-mono text-right bg-background border rounded-lg px-3 py-1.5 h-9 ${
                            isModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground focus:border-primary/50'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => convertToMatrix(key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground bg-secondary border border-border/60 flex items-center gap-1 shadow-2xs transition-colors"
                          title="Convert to Per-Level Matrix"
                        >
                          <Layers className="w-3.5 h-3.5" /> Scale
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleMatrix(key)}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-primary/15 text-primary border border-primary/30 font-medium shadow-2xs"
                        >
                          {rawVal.length} Levels Defined {expandedMatrix[key] ? '▲' : '▼'}
                        </button>
                        <button
                          type="button"
                          onClick={() => convertToScalar(key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground bg-secondary border border-border/60 transition-colors shadow-2xs"
                          title="Convert back to single uniform value"
                        >
                          Uniform
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Level Matrix Table View */}
                {isMatrix && expandedMatrix[key] && (
                  <div className="pt-2.5 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {rawVal.map((item, idx) => (
                      <div
                        key={item.Level || idx + 1}
                        className="flex items-center justify-between bg-card border border-border/80 rounded-lg px-3 py-2 text-xs font-mono shadow-2xs"
                      >
                        <span className="text-xs text-muted-foreground font-medium shrink-0">
                          Lv.{item.Level}
                        </span>
                        <input
                          type="number"
                          value={item.Time}
                          onChange={(e) => updateMatrixLevel(key, idx, Number(e.target.value))}
                          className="w-full min-w-0 text-right bg-transparent text-foreground outline-none text-xs font-mono pl-2 font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
