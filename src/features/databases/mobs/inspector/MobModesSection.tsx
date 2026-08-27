import { useState } from 'react';
import { useMobEditStore } from '@/stores/mobEditStore';
import { EffectiveMob } from '@/domain/database/mob/effectiveMob';
import { MOB_MODES } from '@/domain/database/mob/mobTypes';
import {
  computeEffectiveMobModes,
  MOB_AI_DEFINITIONS,
  MOB_MODE_DESCRIPTIONS_PT_BR,
  normalizeAiId,
} from '@/domain/database/mob/mobAiDefinitions';
import { Bot, RotateCcw, Info } from 'lucide-react';

interface MobModesSectionProps {
  mob: EffectiveMob;
}

export function MobModesSection({ mob }: MobModesSectionProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const { currentSession, setField } = useMobEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = mob.fields;

  const currentAi = pendingChanges.Ai !== undefined ? pendingChanges.Ai : fields.Ai;
  const currentClass = pendingChanges.Class !== undefined ? pendingChanges.Class : fields.Class;
  const currentRace = pendingChanges.Race !== undefined ? pendingChanges.Race : fields.Race;
  const currentExplicitModes =
    (pendingChanges.Modes !== undefined ? pendingChanges.Modes : fields.Modes) || {};

  const normalizedAi = normalizeAiId(currentAi);
  const aiDef = MOB_AI_DEFINITIONS[normalizedAi];

  const resolvedModes = computeEffectiveMobModes({
    ai: currentAi,
    mobClass: currentClass,
    race: currentRace,
    explicitModes: currentExplicitModes,
  });

  const handleToggleMode = (modeName: string) => {
    const isExplicit = Object.prototype.hasOwnProperty.call(currentExplicitModes, modeName);
    const resolved = resolvedModes[modeName];
    const isCurrentlyActive = resolved ? resolved.isEnabled : false;

    const updated = { ...currentExplicitModes };

    if (!isExplicit) {
      if (isCurrentlyActive) {
        // Was inherited ON -> set explicit false to override
        updated[modeName] = false;
      } else {
        // Was inherited OFF -> set explicit true
        updated[modeName] = true;
      }
    } else {
      // Was explicitly configured in YAML -> remove the explicit override
      delete updated[modeName];
    }

    const hasAnyKeys = Object.keys(updated).length > 0;
    setField('Modes', hasAnyKeys ? updated : undefined);
  };

  const handleResetToDefaults = () => {
    setField('Modes', undefined);
  };

  const activeCount = Object.values(resolvedModes).filter((m) => m.isEnabled).length;
  const hasExplicitOverrides = Object.keys(currentExplicitModes).length > 0;

  const activeHoverMode = hoveredMode || 'CanMove';
  const activeHoverDescription =
    MOB_MODE_DESCRIPTIONS_PT_BR[activeHoverMode] || 'Sem descrição cadastrada.';
  const activeHoverResolved = resolvedModes[activeHoverMode];

  return (
    <div className="space-y-4">
      {/* AI Context Summary Banner */}
      <div className="bg-[#18181b] p-3.5 rounded border border-[#27272a] space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs font-semibold text-neutral-200">
                Base AI: {aiDef ? aiDef.label : `Custom AI (${normalizedAi})`}
              </div>
              <div className="text-[11px] text-neutral-400">
                {aiDef ? aiDef.description : 'Custom AI behavior ID'}
              </div>
            </div>
          </div>

          {hasExplicitOverrides && (
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-mono bg-sky-950/40 border border-sky-500/30 px-2 py-1 rounded transition-colors"
              title="Remove all YAML mode overrides and reset to base AI defaults"
            >
              <RotateCcw className="w-3 h-3" /> Reset Overrides
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono pt-1 text-neutral-400 border-t border-[#27272a]/60">
          <span>Active Modes: <strong className="text-neutral-200">{activeCount}</strong></span>
          <span>•</span>
          <span>Explicit Overrides: <strong className={hasExplicitOverrides ? 'text-amber-400' : 'text-neutral-500'}>{Object.keys(currentExplicitModes).length}</strong></span>
        </div>
      </div>

      {/* Modes Grid */}
      <div className="bg-[#18181b] p-3.5 rounded border border-[#27272a] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Behavior &amp; Combat Modes Matrix
          </h3>
          <span className="text-[10px] text-neutral-500 font-mono">
            Click to override • Hover for description
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MOB_MODES.map((mode) => {
            const resolved = resolvedModes[mode];
            const isExplicit = Object.prototype.hasOwnProperty.call(currentExplicitModes, mode);
            const explicitVal = currentExplicitModes[mode];
            const isEnabled = resolved ? resolved.isEnabled : false;
            const description = MOB_MODE_DESCRIPTIONS_PT_BR[mode] || mode;

            let badgeText = 'OFF';
            let badgeClass = 'bg-neutral-800 text-neutral-500 border-[#27272a]';

            if (isExplicit) {
              if (explicitVal === true) {
                badgeText = 'Explicit ON';
                badgeClass = 'bg-sky-950 text-sky-300 border-sky-500/50';
              } else {
                badgeText = 'Explicit OFF';
                badgeClass = 'bg-red-950 text-red-300 border-red-500/50';
              }
            } else if (isEnabled && resolved) {
              if (resolved.origin === 'ai') {
                badgeText = `AI (${normalizedAi})`;
                badgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
              } else if (resolved.origin === 'class') {
                badgeText = `Class (${currentClass})`;
                badgeClass = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
              } else if (resolved.origin === 'race') {
                badgeText = `Race (${currentRace})`;
                badgeClass = 'bg-purple-950/60 text-purple-300 border-purple-500/30';
              }
            }

            const isHovered = hoveredMode === mode;

            return (
              <button
                key={mode}
                type="button"
                title={`${mode}: ${description}`}
                onMouseEnter={() => setHoveredMode(mode)}
                onMouseLeave={() => setHoveredMode((curr) => (curr === mode ? null : curr))}
                onClick={() => handleToggleMode(mode)}
                className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-all border text-left group ${
                  isHovered
                    ? 'ring-1 ring-sky-500/50 bg-[#1e2832]'
                    : isEnabled
                    ? 'bg-[#18232c]/50 text-neutral-100 border-sky-500/30 hover:border-sky-500/60'
                    : 'bg-[#141416] text-neutral-400 hover:text-neutral-200 border-[#27272a] hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isEnabled
                        ? isExplicit
                          ? 'bg-sky-400 shadow-sm shadow-sky-400/80'
                          : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : isExplicit
                        ? 'bg-red-400 shadow-sm shadow-red-400/50'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <span className={`truncate ${isEnabled ? 'font-medium' : ''}`}>{mode}</span>
                </div>

                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap font-mono ${badgeClass}`}
                >
                  {badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Description Card on Hover */}
        <div className="bg-[#141416] p-2.5 rounded border border-sky-500/20 flex items-start gap-2 text-xs">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-mono font-semibold text-neutral-200 flex items-center gap-2">
              <span>{activeHoverMode}</span>
              {activeHoverResolved && (
                <span className="text-[10px] font-normal text-neutral-400 font-mono">
                  • {activeHoverResolved.originDetail}
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-300 leading-snug">
              {activeHoverDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
