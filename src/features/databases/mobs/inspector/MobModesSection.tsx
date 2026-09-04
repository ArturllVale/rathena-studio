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
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-pastel-blue" />
            <div>
              <div className="text-sm font-semibold text-foreground">
                Base AI: {aiDef ? aiDef.label : `Custom AI (${normalizedAi})`}
              </div>
              <div className="text-xs text-muted-foreground">
                {aiDef ? aiDef.description : 'Custom AI behavior ID'}
              </div>
            </div>
          </div>

          {hasExplicitOverrides && (
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 text-xs text-pastel-blue hover:text-pastel-blue/80 font-mono bg-pastel-blue/15 border border-pastel-blue/30 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
              title="Remove all YAML mode overrides and reset to base AI defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Overrides
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono pt-2 text-muted-foreground border-t border-border/60">
          <span>Active Modes: <strong className="text-foreground">{activeCount}</strong></span>
          <span>•</span>
          <span>Explicit Overrides: <strong className={hasExplicitOverrides ? 'text-amber-500 dark:text-amber-300' : 'text-muted-foreground'}>{Object.keys(currentExplicitModes).length}</strong></span>
        </div>
      </div>

      {/* Modes Grid */}
      <div className="bg-card border border-border/80 p-4 rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Behavior &amp; Combat Modes Matrix
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            Click to override • Hover for description
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MOB_MODES.map((mode) => {
            const resolved = resolvedModes[mode];
            const isExplicit = Object.prototype.hasOwnProperty.call(currentExplicitModes, mode);
            const explicitVal = currentExplicitModes[mode];
            const isEnabled = resolved ? resolved.isEnabled : false;
            const description = MOB_MODE_DESCRIPTIONS_PT_BR[mode] || mode;

            let badgeText = 'OFF';
            let badgeClass = 'bg-secondary text-muted-foreground/60 border-border/60';

            if (isExplicit) {
              if (explicitVal === true) {
                badgeText = 'Explicit ON';
                badgeClass = 'bg-pastel-blue/20 text-pastel-blue border-pastel-blue/40 font-semibold';
              } else {
                badgeText = 'Explicit OFF';
                badgeClass = 'bg-pastel-rose/20 text-pastel-rose border-pastel-rose/40 font-semibold';
              }
            } else if (isEnabled && resolved) {
              if (resolved.origin === 'ai') {
                badgeText = `AI (${normalizedAi})`;
                badgeClass = 'bg-pastel-mint/20 text-pastel-mint border-pastel-mint/40 font-medium';
              } else if (resolved.origin === 'class') {
                badgeText = `Class (${currentClass})`;
                badgeClass = 'bg-pastel-lavender/20 text-pastel-lavender border-pastel-lavender/40 font-medium';
              } else if (resolved.origin === 'race') {
                badgeText = `Race (${currentRace})`;
                badgeClass = 'bg-pastel-peach/20 text-pastel-peach border-pastel-peach/40 font-medium';
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
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-mono transition-all border text-left group shadow-2xs ${
                  isHovered
                    ? 'ring-1 ring-primary/60 bg-accent/60 border-primary/40'
                    : isEnabled
                    ? 'bg-primary/5 text-foreground border-primary/30 hover:border-primary/50'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border/80 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isEnabled
                        ? isExplicit
                          ? 'bg-pastel-blue shadow-xs shadow-pastel-blue/80'
                          : 'bg-pastel-mint shadow-xs shadow-pastel-mint/50'
                        : isExplicit
                        ? 'bg-pastel-rose shadow-xs shadow-pastel-rose/50'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                  <span className={`truncate ${isEnabled ? 'font-semibold text-foreground' : ''}`}>{mode}</span>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap font-mono ${badgeClass}`}
                >
                  {badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Description Card on Hover */}
        <div className="bg-accent/40 p-3 rounded-xl border border-border/80 flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-pastel-blue shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-mono font-semibold text-foreground flex items-center gap-2">
              <span>{activeHoverMode}</span>
              {activeHoverResolved && (
                <span className="text-xs font-normal text-muted-foreground font-mono">
                  • {activeHoverResolved.originDetail}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground leading-snug">
              {activeHoverDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
