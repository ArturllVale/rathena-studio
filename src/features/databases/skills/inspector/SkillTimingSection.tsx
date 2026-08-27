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
    <div className="space-y-3.5">
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Cast Times, Delays &amp; Durations (ms)
          </h3>
        </div>

        <div className="space-y-2">
          {TIMING_FIELDS.map(({ key, label, desc }) => {
            const rawVal = getFieldValue(key);
            const isMatrix = Array.isArray(rawVal);
            const isModified = pendingChanges[key] !== undefined;

            return (
              <div
                key={key}
                className="bg-[#141416] p-2 rounded border border-[#27272a]/60 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-neutral-300 flex items-center gap-1">
                      {isModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                      {label}
                    </span>
                    <span className="text-[10px] text-neutral-500">{desc}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isMatrix ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="0 ms"
                          value={rawVal === undefined || rawVal === null ? '' : String(rawVal)}
                          onChange={(e) => updateScalar(key, e.target.value)}
                          className={`w-20 sm:w-24 text-xs font-mono text-right bg-[#1f1f23] border rounded px-2 py-0.5 h-6.5 ${
                            isModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => convertToMatrix(key)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 hover:text-sky-300 bg-[#1f1f23] border border-[#27272a] flex items-center gap-1"
                          title="Convert to Per-Level Matrix"
                        >
                          <Layers className="w-3 h-3" /> Scale
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleMatrix(key)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-600/20 text-sky-300 border border-sky-500/40"
                        >
                          {rawVal.length} Levels Defined {expandedMatrix[key] ? '▲' : '▼'}
                        </button>
                        <button
                          type="button"
                          onClick={() => convertToScalar(key)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 hover:text-neutral-200 bg-[#1f1f23] border border-[#27272a]"
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
                  <div className="pt-2 border-t border-[#27272a]/50 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {rawVal.map((item, idx) => (
                      <div
                        key={item.Level || idx + 1}
                        className="flex items-center justify-between bg-[#1f1f23] border border-[#27272a] rounded px-2 py-1 text-xs font-mono"
                      >
                        <span className="text-[10px] text-neutral-400 font-medium shrink-0">
                          Lv.{item.Level}
                        </span>
                        <input
                          type="number"
                          value={item.Time}
                          onChange={(e) => updateMatrixLevel(key, idx, Number(e.target.value))}
                          className="w-full min-w-0 text-right bg-transparent text-neutral-200 outline-none text-xs font-mono pl-1.5"
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
