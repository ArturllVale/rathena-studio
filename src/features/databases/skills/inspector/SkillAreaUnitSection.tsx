import { useSkillEditStore } from '@/stores/skillEditStore';
import { EffectiveSkill } from '@/domain/database/skill/effectiveSkill';
import {
  SkillUnit,
  SkillRawFields,
  SKILL_ELEMENTS,
  SKILL_UNIT_TARGETS,
  SKILL_SPLASH_AREA_OPTIONS,
  SkillElement,
  SkillUnitTarget,
} from '@/domain/database/skill/skillTypes';
import { Layers, Crosshair, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SkillAreaUnitSectionProps {
  skill: EffectiveSkill;
}

const COMMON_DAMAGE_FLAGS = [
  'NoDamage',
  'Splash',
  'SplashSplit',
  'IgnoreAtkCard',
  'IgnoreElement',
  'IgnoreDefense',
  'IgnoreFlee',
  'IgnoreDefCard',
  'IgnoreLongCard',
  'Critical',
] as const;

const COMMON_SKILL_FLAGS = [
  'IsQuest',
  'IsNpc',
  'IsWedding',
  'IsSpirit',
  'IsGuild',
  'IsSong',
  'IsEnsemble',
  'IsTrap',
  'TargetSelf',
  'NoTargetSelf',
  'PartyOnly',
  'GuildOnly',
  'NoTargetEnemy',
  'IsShadowSpell',
  'IsChorus',
  'IgnoreBgReduction',
  'IgnoreGvgReduction',
  'DisableNearNpc',
  'TargetTrap',
  'IgnoreLandProtector',
  'AllowWhenHidden',
  'AllowWhenPerforming',
  'TargetEmperium',
  'IgnoreKagehumi',
  'IgnoreHovering',
  'AllowOnWarg',
  'AllowOnMado',
  'ShowScale',
  'IgnoreGtb',
  'Toggleable',
] as const;

export function SkillAreaUnitSection({ skill }: SkillAreaUnitSectionProps) {
  const { currentSession, setField } = useSkillEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = skill.fields;

  const currentDamageFlags =
    (pendingChanges.DamageFlags !== undefined ? pendingChanges.DamageFlags : fields.DamageFlags) || {};
  const currentFlags =
    (pendingChanges.Flags !== undefined ? pendingChanges.Flags : fields.Flags) || {};
  const currentCopyFlags =
    (pendingChanges.CopyFlags !== undefined ? pendingChanges.CopyFlags : fields.CopyFlags) || {};
  const currentUnit: SkillUnit =
    (pendingChanges.Unit !== undefined ? pendingChanges.Unit : fields.Unit) || {};

  const currentElement =
    pendingChanges.Element !== undefined ? pendingChanges.Element : fields.Element;
  const isElementScalar = typeof currentElement === 'string' || currentElement === undefined;
  const elementValue = typeof currentElement === 'string' ? currentElement : 'Neutral';

  const currentSplash =
    pendingChanges.SplashArea !== undefined ? pendingChanges.SplashArea : fields.SplashArea;
  const isSplashScalar = typeof currentSplash === 'number' || currentSplash === undefined;
  const splashValue = typeof currentSplash === 'number' ? currentSplash : 0;

  const currentUnitTarget = (currentUnit.Target as string) || 'All';
  const currentUnitLayout = typeof currentUnit.Layout === 'number' ? currentUnit.Layout : 0;

  const toggleDamageFlag = (flag: string) => {
    const updated = { ...currentDamageFlags };
    if (updated[flag]) {
      delete updated[flag];
    } else {
      updated[flag] = true;
    }
    setField('DamageFlags', Object.keys(updated).length > 0 ? updated : undefined);
  };

  const toggleSkillFlag = (flag: string) => {
    const updated = { ...currentFlags };
    if (updated[flag]) {
      delete updated[flag];
    } else {
      updated[flag] = true;
    }
    setField('Flags', Object.keys(updated).length > 0 ? updated : undefined);
  };

  const updateUnitField = <K extends keyof SkillUnit>(key: K, val: SkillUnit[K] | undefined) => {
    const updated: SkillUnit = { ...currentUnit };
    if (val === undefined || val === null || val === '') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    setField('Unit', Object.keys(updated).length > 0 ? updated : undefined);
  };

  const renderSimpleField = (label: string, fieldKey: keyof SkillRawFields, isNum = true) => {
    const isModified = pendingChanges[fieldKey] !== undefined;
    const val = isModified ? pendingChanges[fieldKey] : fields[fieldKey];
    const isScalar = typeof val === 'number' || typeof val === 'string' || val === undefined;

    return (
      <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-pastel-blue shrink-0" />}
          {label}
        </span>
        {isScalar ? (
          <input
            type={isNum ? 'number' : 'text'}
            placeholder="0"
            value={val === undefined || val === null ? '' : String(val)}
            onChange={(e) => {
              const v = e.target.value;
              (setField as (k: keyof SkillRawFields, val: unknown) => void)(
                fieldKey,
                v === '' ? undefined : isNum ? Number(v) : v
              );
            }}
            className="w-24 sm:w-28 text-sm font-mono text-right bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
          />
        ) : (
          <span className="text-xs font-mono text-pastel-blue">Scaled Array</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Area & Combat Ranges */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="w-4 h-4 text-pastel-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Range, Splash &amp; Element
          </h3>
        </div>

        {renderSimpleField('Cast Range (cells)', 'Range')}
        {renderSimpleField('Hit Count (strikes)', 'HitCount')}

        {/* Skill Element Dropdown */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground font-medium">Element</span>
          {isElementScalar ? (
            <div className="w-40">
              <Select
                value={elementValue}
                onValueChange={(val) => setField('Element', val as SkillElement)}
              >
                <SelectTrigger className="h-9 text-sm font-mono border-border/80 bg-background rounded-lg">
                  <SelectValue placeholder="Element" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_ELEMENTS.map((el) => (
                    <SelectItem key={el} value={el}>
                      {el}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className="text-xs font-mono text-pastel-blue">Scaled Array</span>
          )}
        </div>

        {/* Splash Area Dropdown */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground font-medium">Splash Area (AoE)</span>
          {isSplashScalar ? (
            <div className="w-52">
              <Select
                value={String(splashValue)}
                onValueChange={(val) => setField('SplashArea', Number(val))}
              >
                <SelectTrigger className="h-9 text-sm font-mono border-border/80 bg-background rounded-lg">
                  <SelectValue placeholder="Splash Area" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_SPLASH_AREA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className="text-xs font-mono text-pastel-blue">Scaled Array</span>
          )}
        </div>

        {renderSimpleField('Knockback (cells)', 'Knockback')}
        {renderSimpleField('Active Instances on Ground', 'ActiveInstance')}
        {renderSimpleField('AP Gained (GiveAp)', 'GiveAp')}
      </div>

      {/* Ground Unit / Field Trap Properties */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-pastel-amber" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ground Unit &amp; AoE Objects (Unit)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Unit ID / Effect</label>
            <input
              type="text"
              placeholder="e.g. Fire_Wall"
              value={currentUnit.Id || ''}
              onChange={(e) => updateUnitField('Id', e.target.value || undefined)}
              className="text-sm font-mono bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Unit Target Selector</label>
            <Select
              value={currentUnitTarget}
              onValueChange={(val) => updateUnitField('Target', val as SkillUnitTarget)}
            >
              <SelectTrigger className="h-9 text-sm font-mono border-border/80 bg-background rounded-lg">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_UNIT_TARGETS.map((tgt) => (
                  <SelectItem key={tgt} value={tgt}>
                    {tgt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Layout Size</label>
            <Select
              value={String(currentUnitLayout)}
              onValueChange={(val) => updateUnitField('Layout', Number(val))}
            >
              <SelectTrigger className="h-9 text-sm font-mono border-border/80 bg-background rounded-lg">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_SPLASH_AREA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Interval (ms)</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={currentUnit.Interval === undefined ? '' : String(currentUnit.Interval)}
              onChange={(e) =>
                updateUnitField('Interval', e.target.value === '' ? undefined : Number(e.target.value))
              }
              className="text-sm font-mono text-right bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Damage & Engine Flags */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-pastel-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Damage &amp; Execution Flags ({Object.keys(currentDamageFlags).length + Object.keys(currentFlags).length})
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_DAMAGE_FLAGS.map((df) => {
            const isSelected = Boolean(currentDamageFlags[df]);
            return (
              <button
                key={df}
                type="button"
                onClick={() => toggleDamageFlag(df)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border shadow-2xs ${
                  isSelected
                    ? 'bg-pastel-rose/20 text-pastel-rose border-pastel-rose/40 font-semibold'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border/60'
                }`}
              >
                {df}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {COMMON_SKILL_FLAGS.map((sf) => {
            const isSelected = Boolean(currentFlags[sf]);
            return (
              <button
                key={sf}
                type="button"
                onClick={() => toggleSkillFlag(sf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border shadow-2xs ${
                  isSelected
                    ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border/60'
                }`}
              >
                {sf}
              </button>
            );
          })}
        </div>

        {/* Copy Flags */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Copyable (Plagiarism / Reproduce)</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                const current = currentCopyFlags.Skill || {};
                setField('CopyFlags', {
                  ...currentCopyFlags,
                  Skill: { ...current, Plagiarism: !current.Plagiarism },
                });
              }}
              className={`px-2.5 py-1 rounded-lg border shadow-2xs transition-colors ${
                currentCopyFlags.Skill?.Plagiarism
                  ? 'bg-pastel-mint/20 text-pastel-mint border-pastel-mint/40 font-semibold'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border/60'
              }`}
            >
              Plagiarism
            </button>
            <button
              type="button"
              onClick={() => {
                const current = currentCopyFlags.Skill || {};
                setField('CopyFlags', {
                  ...currentCopyFlags,
                  Skill: { ...current, Reproduce: !current.Reproduce },
                });
              }}
              className={`px-2.5 py-1 rounded-lg border shadow-2xs transition-colors ${
                currentCopyFlags.Skill?.Reproduce
                  ? 'bg-pastel-mint/20 text-pastel-mint border-pastel-mint/40 font-semibold'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border/60'
              }`}
            >
              Reproduce
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
