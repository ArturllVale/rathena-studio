import { useState } from 'react';
import { useSkillEditStore } from '@/stores/skillEditStore';
import { EffectiveSkill } from '@/domain/database/skill/effectiveSkill';
import {
  SkillRequires,
  SkillItemCost,
  SkillLevelAmount,
  SKILL_REQUIRED_STATES,
  SKILL_AMMO_TYPES,
  SkillRequiredState,
  SkillAmmoType,
} from '@/domain/database/skill/skillTypes';
import { WEAPON_SUBTYPES } from '@/domain/database/item/itemTypes';
import { Plus, Trash2, ShieldAlert, Sparkles, Crosshair, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SkillRequirementsSectionProps {
  skill: EffectiveSkill;
}

const ALL_SKILL_WEAPONS = [
  ...WEAPON_SUBTYPES,
  'Rifle',
  'Gatling',
  'Shotgun',
  'Grenade',
  'Huuma',
  '2hStaff',
] as const;

type CostFieldKey =
  | 'SpCost'
  | 'HpCost'
  | 'ApCost'
  | 'SpRateCost'
  | 'HpRateCost'
  | 'ZenyCost'
  | 'SpiritSphereCost'
  | 'MaxHpTrigger'
  | 'AmmoAmount';

const RESOURCE_COST_FIELDS: { key: CostFieldKey; label: string; desc: string }[] = [
  { key: 'SpCost', label: 'SP Cost', desc: 'Base SP consumed on cast' },
  { key: 'HpCost', label: 'HP Cost', desc: 'Base HP consumed on cast' },
  { key: 'ApCost', label: 'AP Cost (4th Job)', desc: 'Activity points consumed' },
  { key: 'SpRateCost', label: 'SP Rate Cost (%)', desc: 'Percentage SP cost (positive = current, negative = max)' },
  { key: 'HpRateCost', label: 'HP Rate Cost (%)', desc: 'Percentage HP cost (positive = current, negative = max)' },
  { key: 'ZenyCost', label: 'Zeny Cost', desc: 'Zeny currency fee per cast' },
  { key: 'SpiritSphereCost', label: 'Spirit Sphere Cost', desc: 'Number of spirit spheres consumed' },
  { key: 'MaxHpTrigger', label: 'Max HP Trigger', desc: 'Maximum character HP threshold to enable cast' },
];

export function SkillRequirementsSection({ skill }: SkillRequirementsSectionProps) {
  const { currentSession, setField } = useSkillEditStore();
  const [expandedCostMatrix, setExpandedCostMatrix] = useState<Record<string, boolean>>({});

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = skill.fields;
  const maxLevel = (pendingChanges.MaxLevel !== undefined ? pendingChanges.MaxLevel : fields.MaxLevel) || 10;

  const currentRequires: SkillRequires =
    (pendingChanges.Requires !== undefined ? pendingChanges.Requires : fields.Requires) || {};
  const currentWeapons = currentRequires.Weapon || {};
  const currentItemCosts: SkillItemCost[] = currentRequires.ItemCost || [];
  const currentState = (currentRequires.State as string) || 'None';
  const currentAmmo = typeof currentRequires.Ammo === 'string' ? currentRequires.Ammo : 'None';

  const updateRequiresField = <K extends keyof SkillRequires>(key: K, val: SkillRequires[K] | undefined) => {
    const updated: SkillRequires = { ...currentRequires };
    if (val === undefined || val === null || val === '') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    setField('Requires', Object.keys(updated).length > 0 ? updated : undefined);
  };

  const toggleCostMatrix = (key: string) => {
    setExpandedCostMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const convertToCostMatrix = (key: CostFieldKey) => {
    const currentVal = currentRequires[key];
    const baseAmount = typeof currentVal === 'number' ? currentVal : 10;
    const matrix: SkillLevelAmount[] = [];
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      matrix.push({ Level: lvl, Amount: baseAmount });
    }
    updateRequiresField(key, matrix);
    setExpandedCostMatrix((prev) => ({ ...prev, [key]: true }));
  };

  const convertToCostScalar = (key: CostFieldKey) => {
    const currentVal = currentRequires[key];
    const firstAmount = Array.isArray(currentVal) && currentVal.length > 0 ? currentVal[0].Amount : 0;
    updateRequiresField(key, firstAmount > 0 ? firstAmount : undefined);
    setExpandedCostMatrix((prev) => ({ ...prev, [key]: false }));
  };

  const updateCostMatrixLevel = (key: CostFieldKey, levelIndex: number, newAmount: number) => {
    const currentVal = currentRequires[key];
    if (!Array.isArray(currentVal)) return;

    const updated = [...currentVal];
    updated[levelIndex] = { ...updated[levelIndex], Amount: newAmount };
    updateRequiresField(key, updated);
  };

  const toggleWeapon = (w: string) => {
    const updatedWeapons = { ...currentWeapons };
    if (updatedWeapons[w]) {
      delete updatedWeapons[w];
    } else {
      updatedWeapons[w] = true;
    }
    updateRequiresField('Weapon', Object.keys(updatedWeapons).length > 0 ? updatedWeapons : undefined);
  };

  const toggleAllWeapons = () => {
    const allSelected = ALL_SKILL_WEAPONS.every((w) => currentWeapons[w]);
    if (allSelected) {
      updateRequiresField('Weapon', undefined);
    } else {
      const allMap: Record<string, boolean> = {};
      ALL_SKILL_WEAPONS.forEach((w) => {
        allMap[w] = true;
      });
      updateRequiresField('Weapon', allMap);
    }
  };

  const addItemCost = () => {
    const list = [...currentItemCosts, { Item: '', Amount: 1 }];
    updateRequiresField('ItemCost', list);
  };

  const updateItemCost = (index: number, patch: Partial<SkillItemCost>) => {
    const list = [...currentItemCosts];
    list[index] = { ...list[index], ...patch };
    updateRequiresField('ItemCost', list);
  };

  const removeItemCost = (index: number) => {
    const list = currentItemCosts.filter((_, i) => i !== index);
    updateRequiresField('ItemCost', list.length > 0 ? list : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Resource Costs Card */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-pastel-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resource &amp; Stat Costs
          </h3>
        </div>

        <div className="space-y-2.5">
          {RESOURCE_COST_FIELDS.map(({ key, label, desc }) => {
            const rawVal = currentRequires[key];
            const isMatrix = Array.isArray(rawVal);
            const isModified =
              pendingChanges.Requires !== undefined &&
              pendingChanges.Requires[key] !== (fields.Requires ? fields.Requires[key] : undefined);

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
                          placeholder="0"
                          value={rawVal === undefined || rawVal === null ? '' : String(rawVal)}
                          onChange={(e) =>
                            updateRequiresField(
                              key,
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className={`w-24 sm:w-28 text-sm font-mono text-right bg-background border rounded-lg px-3 py-1.5 h-9 ${
                            isModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground focus:border-primary/50'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => convertToCostMatrix(key)}
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
                          onClick={() => toggleCostMatrix(key)}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-primary/15 text-primary border border-primary/30 font-medium shadow-2xs"
                        >
                          {rawVal.length} Levels Defined {expandedCostMatrix[key] ? '▲' : '▼'}
                        </button>
                        <button
                          type="button"
                          onClick={() => convertToCostScalar(key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground bg-secondary border border-border/60 transition-colors shadow-2xs"
                          title="Convert back to single uniform value"
                        >
                          Uniform
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Level Cost Matrix Table View */}
                {isMatrix && expandedCostMatrix[key] && (
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
                          value={item.Amount}
                          onChange={(e) => updateCostMatrixLevel(key, idx, Number(e.target.value))}
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

      {/* State & Ammo Special Conditions */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-pastel-mint" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Required State &amp; Ammunition
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Required State Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Required State</label>
            <Select
              value={currentState}
              onValueChange={(val) =>
                updateRequiresField('State', val === 'None' ? undefined : (val as SkillRequiredState))
              }
            >
              <SelectTrigger className="h-9 text-sm font-mono border-border/80 bg-background rounded-lg">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_REQUIRED_STATES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required Ammo Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Required Ammo</label>
            <Select
              value={currentAmmo}
              onValueChange={(val) =>
                updateRequiresField('Ammo', val === 'None' ? undefined : (val as SkillAmmoType))
              }
            >
              <SelectTrigger className="h-9 text-sm font-mono border-border/80 bg-background rounded-lg">
                <SelectValue placeholder="Ammo" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_AMMO_TYPES.map((am) => (
                  <SelectItem key={am} value={am}>
                    {am}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ammo Amount per Cast */}
        <div className="flex items-center justify-between py-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium">Ammo Amount per Cast</span>
          {typeof currentRequires.AmmoAmount === 'number' || currentRequires.AmmoAmount === undefined ? (
            <input
              type="number"
              placeholder="1"
              value={currentRequires.AmmoAmount === undefined ? '' : String(currentRequires.AmmoAmount)}
              onChange={(e) =>
                updateRequiresField(
                  'AmmoAmount',
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              className="w-24 sm:w-28 text-sm font-mono text-right bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
            />
          ) : (
            <span className="text-xs font-mono text-pastel-blue">Scaled Array</span>
          )}
        </div>
      </div>

      {/* Item Requirements Table */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Item / Catalyst Consumables ({currentItemCosts.length})
          </h3>
          <button
            type="button"
            onClick={addItemCost}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {currentItemCosts.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border/80 font-mono">
            No item catalysts or consumables required.
          </div>
        ) : (
          <div className="space-y-2">
            {currentItemCosts.map((cost, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/80 hover:border-border transition-colors shadow-2xs"
              >
                <div className="w-6 text-center text-xs font-mono text-muted-foreground shrink-0">#{idx + 1}</div>
                <input
                  type="text"
                  placeholder="Item AegisName (e.g. Red_Gemstone)"
                  value={cost.Item}
                  onChange={(e) => updateItemCost(idx, { Item: e.target.value })}
                  className="flex-1 min-w-0 text-xs font-mono bg-background border border-border/80 rounded-lg px-3 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
                  autoFocus={cost.Item === ''}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={cost.Amount}
                  onChange={(e) => updateItemCost(idx, { Amount: Number(e.target.value) })}
                  className="w-20 text-xs font-mono text-right bg-background border border-border/80 rounded-lg px-2.5 py-1.5 h-9 text-foreground focus:border-primary/50 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeItemCost(idx)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weapon Requirements Grid */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-pastel-peach" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Weapon Requirements ({Object.keys(currentWeapons).length === 0 ? 'All / None' : Object.keys(currentWeapons).length})
            </h3>
          </div>
          <button
            type="button"
            onClick={toggleAllWeapons}
            className="text-xs font-mono text-primary hover:underline font-medium"
          >
            {ALL_SKILL_WEAPONS.every((w) => currentWeapons[w]) ? 'Clear All' : 'Select All'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ALL_SKILL_WEAPONS.map((w) => {
            const isSelected = Boolean(currentWeapons[w]);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWeapon(w)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border shadow-2xs ${
                  isSelected
                    ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border/60'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
