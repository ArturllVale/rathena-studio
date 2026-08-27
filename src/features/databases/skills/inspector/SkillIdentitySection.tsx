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
      <div className="flex flex-col py-1 border-b border-[#27272a]/40 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-neutral-400 font-medium truncate" title={label}>
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
            className={`text-xs font-mono text-right bg-[#141416] border rounded px-2 py-0.5 h-6.5 shrink-0 ${
              isNum ? 'w-20 sm:w-24' : 'w-44 sm:w-56'
            } ${
              readOnly
                ? 'border-transparent text-neutral-500 cursor-not-allowed bg-transparent'
                : errorMsg
                ? 'border-red-500/50 text-red-200'
                : isModified
                ? 'border-sky-500/50 text-sky-200'
                : 'border-[#27272a] text-neutral-200'
            }`}
          />
        </div>
        {errorMsg && <div className="text-[10px] text-red-400 mt-0.5 text-right">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'skill-db-base-root' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-neutral-500 mt-0.5 text-right truncate font-mono">
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
    <div className="space-y-3.5">
      {/* Skill Identification Card */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          Skill Identity
        </h3>
        {renderField('Skill ID', 'Id', 'number', true)}
        {renderField('Aegis Name', 'Name')}
        {renderField('Description', 'Description')}
        {renderField('Max Level', 'MaxLevel', 'number')}
        {renderField('Status Inflicted', 'Status')}
      </div>

      {/* Skill Classification & Execution */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Classification &amp; Mechanics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Skill Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Skill Type</label>
            <Select
              value={currentType}
              onValueChange={(val) => setField('Type', val as SkillType)}
            >
              <SelectTrigger
                className={`h-6.5 text-xs font-mono ${
                  isTypeModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a]'
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
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Target Type</label>
            <Select
              value={currentTarget}
              onValueChange={(val) => setField('TargetType', val as SkillTargetType)}
            >
              <SelectTrigger
                className={`h-6.5 text-xs font-mono ${
                  isTargetModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a]'
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
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Hit Classification</label>
            <Select
              value={currentHit}
              onValueChange={(val) => setField('Hit', val as SkillHitType)}
            >
              <SelectTrigger
                className={`h-6.5 text-xs font-mono ${
                  isHitModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a]'
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
          <div className="flex items-center justify-between py-1 bg-[#141416] border border-[#27272a] rounded px-2.5 h-11 self-end">
            <div className="flex flex-col">
              <span className="text-xs text-neutral-300 font-medium">Cast Cancel</span>
              <span className="text-[10px] text-neutral-500">Cancel when hit</span>
            </div>
            <button
              type="button"
              onClick={() => setField('CastCancel', !currentCastCancel)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                currentCastCancel ? 'bg-sky-600' : 'bg-[#27272a]'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                  currentCastCancel ? 'translate-x-3.5' : 'translate-x-0.5'
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
