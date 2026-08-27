import { useMobEditStore } from '@/stores/mobEditStore';
import { EffectiveMob } from '@/domain/database/mob/effectiveMob';
import { MobRawFields, MOB_CLASSES } from '@/domain/database/mob/mobTypes';
import { MOB_AI_DEFINITIONS, normalizeAiId } from '@/domain/database/mob/mobAiDefinitions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MobIdentitySectionProps {
  mob: EffectiveMob;
}

export function MobIdentitySection({ mob }: MobIdentitySectionProps) {
  const { currentSession, setField, validationIssues } = useMobEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = mob.fields;
  const { fieldOrigins, layerProvenance } = mob;

  const renderField = (
    label: string,
    fieldName: keyof MobRawFields,
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
                (setField as (f: keyof MobRawFields, v: unknown) => void)(fieldName, Number(val));
              } else {
                (setField as (f: keyof MobRawFields, v: unknown) => void)(fieldName, val);
              }
            }}
            className={`text-xs font-mono text-right bg-[#141416] border rounded px-1.5 py-0.5 h-6.5 shrink-0 ${
              isNum ? 'w-14' : 'w-36 sm:w-44'
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
        {!isModified && origin && origin.layerId !== 'mob-db-mode-root-re' && origin.layerId !== 'mob-db-mode-root-pre_re' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-neutral-500 mt-0.5 text-right truncate font-mono">
            via {origin.filePath || origin.layerId}
          </div>
        )}
      </div>
    );
  };

  const currentClass = pendingChanges.Class !== undefined ? pendingChanges.Class : fields.Class;
  const isClassModified = pendingChanges.Class !== undefined;

  const currentAi = pendingChanges.Ai !== undefined ? pendingChanges.Ai : fields.Ai;
  const normalizedAi = normalizeAiId(currentAi);
  const activeAiDef = MOB_AI_DEFINITIONS[normalizedAi];
  const isAiModified = pendingChanges.Ai !== undefined;

  return (
    <div className="space-y-3.5">
      {/* Monster Identification Card */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          Monster Identity
        </h3>
        {renderField('Monster ID', 'Id', 'number', true)}
        {renderField('Aegis Name', 'AegisName')}
        {renderField('Display Name', 'Name')}
        {renderField('Japanese Name', 'JapaneseName')}

        {/* Monster Class */}
        <div className="flex flex-col py-1 border-b border-[#27272a]/40">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-neutral-400 font-medium">Monster Class</label>
            <div className="w-28 sm:w-32 shrink-0">
              <Select
                value={currentClass || 'Normal'}
                onValueChange={(val) => setField('Class', val as (typeof MOB_CLASSES)[number])}
              >
                <SelectTrigger
                  className={`h-6.5 text-xs font-mono ${
                    isClassModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a]'
                  }`}
                >
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {MOB_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Behavior Type Select */}
        <div className="flex flex-col py-1 border-b border-[#27272a]/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-neutral-400 font-medium">AI Behavior Type</label>
              {activeAiDef && (
                <span className="text-[10px] text-neutral-500 font-mono">
                  {activeAiDef.hex} • {activeAiDef.baseModes.join(', ')}
                </span>
              )}
            </div>
            <div className="w-44 sm:w-52 shrink-0">
              <Select
                value={normalizedAi}
                onValueChange={(val) => setField('Ai', val)}
              >
                <SelectTrigger
                  className={`h-6.5 text-xs font-mono ${
                    isAiModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a]'
                  }`}
                >
                  <SelectValue placeholder="AI Behavior" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MOB_AI_DEFINITIONS).map((ai) => (
                    <SelectItem key={ai.id} value={ai.id}>
                      {ai.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {activeAiDef && (
            <div className="text-[10px] text-sky-400/80 mt-0.5 font-mono">{activeAiDef.description}</div>
          )}
        </div>
      </div>

      {/* Level & Experience Rewards (2 Columns) */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          Level &amp; Experience
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {renderField('Base Level', 'Level', 'number')}
          {renderField('Base EXP', 'BaseExp', 'number')}
          {renderField('Job EXP', 'JobExp', 'number')}
          {renderField('MVP EXP Reward', 'MvpExp', 'number')}
        </div>
      </div>
    </div>
  );
}
