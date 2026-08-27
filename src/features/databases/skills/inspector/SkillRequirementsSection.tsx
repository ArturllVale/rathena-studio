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
    <div className="space-y-3.5">
      {/* Resource Costs Card */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Resource &amp; Stat Costs
          </h3>
        </div>

        <div className="space-y-2">
          {RESOURCE_COST_FIELDS.map(({ key, label, desc }) => {
            const rawVal = currentRequires[key];
            const isMatrix = Array.isArray(rawVal);
            const isModified =
              pendingChanges.Requires !== undefined &&
              pendingChanges.Requires[key] !== (fields.Requires ? fields.Requires[key] : undefined);

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
                          placeholder="0"
                          value={rawVal === undefined || rawVal === null ? '' : String(rawVal)}
                          onChange={(e) =>
                            updateRequiresField(
                              key,
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className={`w-20 sm:w-24 text-xs font-mono text-right bg-[#1f1f23] border rounded px-2 py-0.5 h-6.5 ${
                            isModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => convertToCostMatrix(key)}
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
                          onClick={() => toggleCostMatrix(key)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-600/20 text-sky-300 border border-sky-500/40"
                        >
                          {rawVal.length} Levels Defined {expandedCostMatrix[key] ? '▲' : '▼'}
                        </button>
                        <button
                          type="button"
                          onClick={() => convertToCostScalar(key)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 hover:text-neutral-200 bg-[#1f1f23] border border-[#27272a]"
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
                          value={item.Amount}
                          onChange={(e) => updateCostMatrixLevel(key, idx, Number(e.target.value))}
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

      {/* State & Ammo Special Conditions */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Required State &amp; Ammunition
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Required State Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Required State</label>
            <Select
              value={currentState}
              onValueChange={(val) =>
                updateRequiresField('State', val === 'None' ? undefined : (val as SkillRequiredState))
              }
            >
              <SelectTrigger className="h-6.5 text-xs font-mono border-[#27272a]">
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
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Required Ammo</label>
            <Select
              value={currentAmmo}
              onValueChange={(val) =>
                updateRequiresField('Ammo', val === 'None' ? undefined : (val as SkillAmmoType))
              }
            >
              <SelectTrigger className="h-6.5 text-xs font-mono border-[#27272a]">
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
        <div className="flex items-center justify-between py-1 border-t border-[#27272a]/40">
          <span className="text-xs text-neutral-400 font-medium">Ammo Amount per Cast</span>
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
              className="w-20 sm:w-24 text-xs font-mono text-right bg-[#141416] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200"
            />
          ) : (
            <span className="text-[11px] font-mono text-sky-400">Scaled Array</span>
          )}
        </div>
      </div>

      {/* Item Requirements Table */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Item / Catalyst Consumables ({currentItemCosts.length})
          </h3>
          <button
            type="button"
            onClick={addItemCost}
            className="flex items-center gap-1 text-[11px] font-mono bg-sky-600 hover:bg-sky-500 text-white px-2 py-0.5 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>

        {currentItemCosts.length === 0 ? (
          <div className="p-2 text-center text-[11px] text-neutral-500 bg-[#141416] rounded border border-[#27272a]/40 font-mono">
            No item catalysts or consumables required.
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentItemCosts.map((cost, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 p-1.5 rounded bg-[#141416] border border-[#27272a]"
              >
                <div className="w-4 text-center text-[10px] font-mono text-neutral-500 shrink-0">#{idx + 1}</div>
                <input
                  type="text"
                  placeholder="Item AegisName (e.g. Red_Gemstone)"
                  value={cost.Item}
                  onChange={(e) => updateItemCost(idx, { Item: e.target.value })}
                  className="flex-1 min-w-0 text-xs font-mono bg-[#1f1f23] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200"
                  autoFocus={cost.Item === ''}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={cost.Amount}
                  onChange={(e) => updateItemCost(idx, { Amount: Number(e.target.value) })}
                  className="w-16 text-xs font-mono text-right bg-[#1f1f23] border border-[#27272a] rounded px-2 py-0.5 h-6.5 text-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => removeItemCost(idx)}
                  className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weapon Requirements Grid */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Weapon Requirements ({Object.keys(currentWeapons).length === 0 ? 'All / None' : Object.keys(currentWeapons).length})
            </h3>
          </div>
          <button
            type="button"
            onClick={toggleAllWeapons}
            className="text-[10px] font-mono text-sky-400 hover:text-sky-300"
          >
            {ALL_SKILL_WEAPONS.every((w) => currentWeapons[w]) ? 'Clear All' : 'Select All'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {ALL_SKILL_WEAPONS.map((w) => {
            const isSelected = Boolean(currentWeapons[w]);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWeapon(w)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors border ${
                  isSelected
                    ? 'bg-sky-600/30 text-sky-200 border-sky-500/50 font-medium'
                    : 'bg-[#141416] text-neutral-400 hover:text-neutral-200 border-[#27272a]'
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
