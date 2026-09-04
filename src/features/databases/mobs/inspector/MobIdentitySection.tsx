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
                (setField as (f: keyof MobRawFields, v: unknown) => void)(fieldName, Number(val));
              } else {
                (setField as (f: keyof MobRawFields, v: unknown) => void)(fieldName, val);
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
        {!isModified && origin && origin.layerId !== 'mob-db-mode-root-re' && origin.layerId !== 'mob-db-mode-root-pre_re' && origin.layerId !== layerProvenance[0] && (
          <div className="text-xs text-muted-foreground mt-1 text-right truncate font-mono opacity-80">
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
    <div className="space-y-4">
      {/* Monster Identification Card */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Monster Identity
        </h3>
        {renderField('Monster ID', 'Id', 'number', true)}
        {renderField('Aegis Name', 'AegisName')}
        {renderField('Display Name', 'Name')}
        {renderField('Japanese Name', 'JapaneseName')}

        {/* Monster Class */}
        <div className="flex flex-col py-2.5 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              {isClassModified && <span className="w-2 h-2 rounded-full bg-pastel-blue shrink-0" />}
              Monster Class
            </label>
            <div className="w-36 shrink-0">
              <Select
                value={currentClass || 'Normal'}
                onValueChange={(val) => setField('Class', val as (typeof MOB_CLASSES)[number])}
              >
                <SelectTrigger
                  className={`h-9 text-sm font-mono ${
                    isClassModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80'
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
        <div className="flex flex-col py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                {isAiModified && <span className="w-2 h-2 rounded-full bg-pastel-blue shrink-0" />}
                AI Behavior Type
              </label>
              {activeAiDef && (
                <span className="text-xs text-muted-foreground font-mono mt-0.5">
                  {activeAiDef.hex} • {activeAiDef.baseModes.join(', ')}
                </span>
              )}
            </div>
            <div className="w-52 sm:w-60 shrink-0">
              <Select
                value={normalizedAi}
                onValueChange={(val) => setField('Ai', val)}
              >
                <SelectTrigger
                  className={`h-9 text-sm font-mono ${
                    isAiModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80'
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
            <div className="text-xs text-pastel-blue mt-1.5 font-mono">{activeAiDef.description}</div>
          )}
        </div>
      </div>

      {/* Level & Experience Rewards (2 Columns) */}
      <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Level &amp; Experience
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {renderField('Base Level', 'Level', 'number')}
          {renderField('Base EXP', 'BaseExp', 'number')}
          {renderField('Job EXP', 'JobExp', 'number')}
          {renderField('MVP EXP Reward', 'MvpExp', 'number')}
        </div>
      </div>
    </div>
  );
}
