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
        className={`flex flex-col bg-card p-2.5 rounded-xl border transition-all shadow-2xs ${
          error
            ? 'border-destructive bg-destructive/5'
            : isModified
            ? 'border-primary/50 bg-primary/5'
            : 'border-border/80 hover:border-border'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[11px] font-bold font-mono tracking-wider ${accentClass}`}>
            {label}
          </span>
          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue shrink-0" title="Modified" />}
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
          className="w-full text-base font-mono text-center bg-accent/30 rounded-lg border border-border/40 focus:border-primary/50 text-foreground font-semibold p-0 h-8 outline-none transition-colors"
        />
        {!isModified && origin && origin.layerId !== 'mob-db-mode-root-re' && origin.layerId !== 'mob-db-mode-root-pre_re' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-muted-foreground mt-1 text-center truncate font-mono opacity-80">
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
      <div className="flex flex-col py-2 border-b border-border/50 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-muted-foreground font-medium select-none truncate flex items-center gap-1.5" title={label}>
            {isModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue shrink-0" />}
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
            className={`text-sm font-mono text-right bg-card border rounded-lg px-2.5 py-1 w-20 shrink-0 h-9 transition-all ${
              errorMsg
                ? 'border-destructive text-destructive bg-destructive/5'
                : isModified
                ? 'border-primary text-primary bg-primary/5'
                : 'border-border/80 text-foreground focus:border-primary/50'
            }`}
          />
        </div>
        {errorMsg && <div className="text-xs text-destructive mt-1 text-right font-medium">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'mob-db-mode-root-re' && origin.layerId !== 'mob-db-mode-root-pre_re' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-muted-foreground mt-1 text-right truncate font-mono opacity-80">
            via {origin.filePath || origin.layerId}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Vitals & Health */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Health &amp; Energy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {renderField('Max HP', 'Hp')}
          {renderField('Max SP', 'Sp')}
        </div>
      </div>

      {/* Primary Base Stats (STR/AGI/VIT/INT/DEX/LUK) */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Base Attributes
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {renderStatCard('STR', 'Str', 'text-pastel-rose')}
          {renderStatCard('AGI', 'Agi', 'text-pastel-mint')}
          {renderStatCard('VIT', 'Vit', 'text-pastel-peach')}
          {renderStatCard('INT', 'Int', 'text-pastel-blue')}
          {renderStatCard('DEX', 'Dex', 'text-pastel-lavender')}
          {renderStatCard('LUK', 'Luk', 'text-pastel-amber')}
        </div>
      </div>

      {/* Combat Power & Defenses */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Offense &amp; Defense Ratings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {renderField('Attack (Min)', 'Attack')}
          {renderField('Attack2 (Max)', 'Attack2')}
          {renderField('Physical DEF', 'Defense')}
          {renderField('Magic MDEF', 'MagicDefense')}
          {renderField('Physical RES', 'Resistance')}
          {renderField('Magic MRES', 'MagicResistance')}
        </div>
      </div>

      {/* Ranges & Animation Timings */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Ranges &amp; Speed Motions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {renderField('Attack Range', 'AttackRange')}
          {renderField('Skill Range', 'SkillRange')}
          {renderField('Chase Range', 'ChaseRange')}
          {renderField('Walk Speed', 'WalkSpeed')}
          {renderField('Attack Delay', 'AttackDelay')}
          {renderField('Attack Motion', 'AttackMotion')}
          {renderField('Damage Motion', 'DamageMotion')}
          {renderField('Damage Taken %', 'DamageTaken')}
        </div>
      </div>
    </div>
  );
}
