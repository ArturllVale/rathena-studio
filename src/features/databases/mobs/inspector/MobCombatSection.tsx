import { useMobEditStore } from '@/stores/mobEditStore';
import { EffectiveMob } from '@/domain/database/mob/effectiveMob';
import { MobRawFields } from '@/domain/database/mob/mobTypes';

interface MobCombatSectionProps {
  mob: EffectiveMob;
}

export function MobCombatSection({ mob }: MobCombatSectionProps) {
  const { currentSession, setField, validationIssues } = useMobEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = mob.fields;
  const { fieldOrigins, layerProvenance } = mob;

  const renderStatCard = (
    label: string,
    fieldName: keyof MobRawFields,
    accentClass: string
  ) => {
    const isModified = pendingChanges[fieldName] !== undefined;
    const effectiveValue = isModified ? pendingChanges[fieldName] : fields[fieldName];
    const origin = fieldOrigins[fieldName];
    const error = validationIssues.find((i) => i.field === fieldName);

    return (
      <div
        className={`flex flex-col bg-[#141416] p-1.5 rounded border transition-all ${
          error
            ? 'border-red-500/50'
            : isModified
            ? 'border-sky-500/50 bg-sky-950/20'
            : 'border-[#27272a] hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-[9px] font-bold font-mono tracking-wider ${accentClass}`}>
            {label}
          </span>
          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" title="Modified" />}
        </div>
        <input
          type="number"
          value={effectiveValue === undefined || effectiveValue === null ? '' : String(effectiveValue)}
          onChange={(e) => {
            const val = e.target.value;
            (setField as (f: keyof MobRawFields, v: unknown) => void)(
              fieldName,
              val === '' ? undefined : Number(val)
            );
          }}
          className="w-full text-xs font-mono text-center bg-transparent border-0 outline-none text-neutral-100 font-semibold p-0 h-5"
        />
        {!isModified && origin && origin.layerId !== 'mob-db-mode-root-re' && origin.layerId !== 'mob-db-mode-root-pre_re' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[8px] text-neutral-500 mt-0.5 text-center truncate font-mono">
            {origin.filePath || origin.layerId}
          </div>
        )}
      </div>
    );
  };

  const renderField = (label: string, fieldName: keyof MobRawFields) => {
    const isModified = pendingChanges[fieldName] !== undefined;
    const effectiveValue = isModified ? pendingChanges[fieldName] : fields[fieldName];
    const origin = fieldOrigins[fieldName];
    const error = validationIssues.find((i) => i.field === fieldName);
    const errorMsg = error ? error.message : null;

    return (
      <div className="flex flex-col py-1 border-b border-[#27272a]/40 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-neutral-400 font-medium truncate" title={label}>
            {label}
          </label>
          <input
            type="number"
            value={effectiveValue === undefined || effectiveValue === null ? '' : String(effectiveValue)}
            onChange={(e) => {
              const val = e.target.value;
              (setField as (f: keyof MobRawFields, v: unknown) => void)(
                fieldName,
                val === '' ? undefined : Number(val)
              );
            }}
            className={`text-xs font-mono text-right bg-[#141416] border rounded px-2 py-0.5 w-20 sm:w-24 shrink-0 h-6.5 ${
              errorMsg
                ? 'border-red-500/50 text-red-200'
                : isModified
                ? 'border-sky-500/50 text-sky-200'
                : 'border-[#27272a] text-neutral-200'
            }`}
          />
        </div>
        {errorMsg && <div className="text-[10px] text-red-400 mt-0.5 text-right">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'mob-db-mode-root-re' && origin.layerId !== 'mob-db-mode-root-pre_re' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-neutral-500 mt-0.5 text-right truncate font-mono">
            via {origin.filePath || origin.layerId}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Vitals & Health */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          Health &amp; Energy
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {renderField('Max HP', 'Hp')}
          {renderField('Max SP', 'Sp')}
        </div>
      </div>

      {/* Primary Base Stats (STR/AGI/VIT/INT/DEX/LUK) */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1.5">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Base Attributes
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {renderStatCard('STR', 'Str', 'text-red-400')}
          {renderStatCard('AGI', 'Agi', 'text-emerald-400')}
          {renderStatCard('VIT', 'Vit', 'text-amber-400')}
          {renderStatCard('INT', 'Int', 'text-sky-400')}
          {renderStatCard('DEX', 'Dex', 'text-purple-400')}
          {renderStatCard('LUK', 'Luk', 'text-yellow-400')}
        </div>
      </div>

      {/* Combat Power & Defenses */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          Offense &amp; Defense Ratings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {renderField('Attack (Min/Base)', 'Attack')}
          {renderField('Attack2 (Max/Matk)', 'Attack2')}
          {renderField('Physical DEF', 'Defense')}
          {renderField('Magic MDEF', 'MagicDefense')}
          {renderField('Physical RES', 'Resistance')}
          {renderField('Magic MRES', 'MagicResistance')}
        </div>
      </div>

      {/* Ranges & Animation Timings */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          Ranges &amp; Speed Motions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {renderField('Attack Range', 'AttackRange')}
          {renderField('Skill Range', 'SkillRange')}
          {renderField('Chase Range', 'ChaseRange')}
          {renderField('Walk Speed', 'WalkSpeed')}
          {renderField('Attack Delay (ms)', 'AttackDelay')}
          {renderField('Attack Motion (ms)', 'AttackMotion')}
          {renderField('Damage Motion (ms)', 'DamageMotion')}
          {renderField('Damage Taken Rate %', 'DamageTaken')}
        </div>
      </div>
    </div>
  );
}
