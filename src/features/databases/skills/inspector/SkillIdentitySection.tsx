import { useSkillEditStore } from '@/stores/skillEditStore';
import { EffectiveSkill } from '@/domain/database/skill/effectiveSkill';
import {
  SkillRawFields,
  SKILL_TYPES,
  SKILL_TARGET_TYPES,
  SKILL_HIT_TYPES,
  SkillType,
  SkillTargetType,
  SkillHitType,
} from '@/domain/database/skill/skillTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SkillIdentitySectionProps {
  skill: EffectiveSkill;
}

export function SkillIdentitySection({ skill }: SkillIdentitySectionProps) {
  const { currentSession, setField, validationIssues } = useSkillEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = skill.fields;
  const { fieldOrigins, layerProvenance } = skill;

  const renderField = (
    label: string,
    fieldName: keyof SkillRawFields,
    type: 'text' | 'number' = 'text',
    readOnly = false
  ) => {
    const isModified = pendingChanges[fieldName] !== undefined;
    const effectiveValue = isModified ? pendingChanges[fieldName] : fields[fieldName];
    const origin = fieldOrigins[fieldName];
    const error = validationIssues.find((i) => i.field === fieldName);
    const errorMsg = error ? error.message : null;
    const isNum = type === 'number';

    return (
      <div className="flex flex-col py-2.5 border-b border-border/50 last:border-0 relative">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1.5 font-medium truncate" title={label}>
            {isModified && <span className="w-2 h-2 rounded-full bg-pastel-blue shrink-0" title="Modified" />}
            {label}
          </label>
          <input
            type={type}
            disabled={readOnly}
            value={effectiveValue === undefined || effectiveValue === null ? '' : String(effectiveValue)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setField(fieldName, undefined);
              } else if (type === 'number') {
                (setField as (f: keyof SkillRawFields, v: unknown) => void)(fieldName, Number(val));
              } else {
                (setField as (f: keyof SkillRawFields, v: unknown) => void)(fieldName, val);
              }
            }}
            className={`text-sm font-mono text-right bg-card border rounded-lg px-3 py-1.5 h-9 shrink-0 transition-all ${
              isNum ? 'w-24' : 'w-48 sm:w-56'
            } ${
              readOnly
                ? 'border-transparent text-muted-foreground/60 cursor-not-allowed bg-transparent'
                : errorMsg
                ? 'border-destructive text-destructive bg-destructive/5'
                : isModified
                ? 'border-primary text-primary bg-primary/5'
                : 'border-border/80 text-foreground focus:border-primary/50'
            }`}
          />
        </div>
        {errorMsg && <div className="text-xs text-destructive mt-1 text-right font-medium">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'skill-db-base-root' && origin.layerId !== layerProvenance[0] && (
          <div className="text-xs text-muted-foreground mt-1 text-right truncate font-mono opacity-80">
            via {origin.filePath || origin.layerId}
          </div>
        )}
      </div>
    );
  };

  const currentType = (pendingChanges.Type !== undefined ? pendingChanges.Type : fields.Type) || 'None';
  const isTypeModified = pendingChanges.Type !== undefined;

  const currentTarget = (pendingChanges.TargetType !== undefined ? pendingChanges.TargetType : fields.TargetType) || 'Passive';
  const isTargetModified = pendingChanges.TargetType !== undefined;

  const currentHit = (pendingChanges.Hit !== undefined ? pendingChanges.Hit : fields.Hit) || 'Normal';
  const isHitModified = pendingChanges.Hit !== undefined;

  const currentCastCancel = pendingChanges.CastCancel !== undefined ? pendingChanges.CastCancel : fields.CastCancel;

  return (
    <div className="space-y-4">
      {/* Skill Identification Card */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Skill Identity
        </h3>
        {renderField('Skill ID', 'Id', 'number', true)}
        {renderField('Aegis Name', 'Name')}
        {renderField('Description', 'Description')}
        {renderField('Max Level', 'MaxLevel', 'number')}
        {renderField('Status Inflicted', 'Status')}
      </div>

      {/* Skill Classification & Execution */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Classification &amp; Mechanics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Skill Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              {isTypeModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue" />}
              Skill Type
            </label>
            <Select
              value={currentType}
              onValueChange={(val) => setField('Type', val as SkillType)}
            >
              <SelectTrigger
                className={`h-9 text-sm font-mono border-border/80 bg-background ${
                  isTypeModified ? 'border-primary text-primary bg-primary/5' : ''
                }`}
              >
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

          {/* Target Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              {isTargetModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue" />}
              Target Type
            </label>
            <Select
              value={currentTarget}
              onValueChange={(val) => setField('TargetType', val as SkillTargetType)}
            >
              <SelectTrigger
                className={`h-9 text-sm font-mono border-border/80 bg-background ${
                  isTargetModified ? 'border-primary text-primary bg-primary/5' : ''
                }`}
              >
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

          {/* Hit Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              {isHitModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue" />}
              Hit Classification
            </label>
            <Select
              value={currentHit}
              onValueChange={(val) => setField('Hit', val as SkillHitType)}
            >
              <SelectTrigger
                className={`h-9 text-sm font-mono border-border/80 bg-background ${
                  isHitModified ? 'border-primary text-primary bg-primary/5' : ''
                }`}
              >
                <SelectValue placeholder="Hit" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_HIT_TYPES.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cast Cancel Switch */}
          <div className="flex items-center justify-between p-3 bg-accent/30 border border-border/80 rounded-xl h-14 self-end">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Cast Cancel</span>
              <span className="text-[11px] text-muted-foreground">Cancel cast when hit</span>
            </div>
            <button
              type="button"
              onClick={() => setField('CastCancel', !currentCastCancel)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                currentCastCancel ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  currentCastCancel ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {renderField('Cast Defense Reduction (%)', 'CastDefenseReduction', 'number')}
      </div>
    </div>
  );
}
