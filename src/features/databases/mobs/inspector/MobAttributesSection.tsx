import { useMobEditStore } from '@/stores/mobEditStore';
import { EffectiveMob } from '@/domain/database/mob/effectiveMob';
import {
  MOB_SIZES,
  MOB_RACES,
  MOB_ELEMENTS,
  MOB_RACE_GROUPS,
  MobSize,
  MobRace,
  MobElement,
} from '@/domain/database/mob/mobTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MobAttributesSectionProps {
  mob: EffectiveMob;
}

export function MobAttributesSection({ mob }: MobAttributesSectionProps) {
  const { currentSession, setField } = useMobEditStore();

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = mob.fields;

  const currentSize = (pendingChanges.Size !== undefined ? pendingChanges.Size : fields.Size) || 'Small';
  const currentRace = (pendingChanges.Race !== undefined ? pendingChanges.Race : fields.Race) || 'Formless';
  const currentElement = (pendingChanges.Element !== undefined ? pendingChanges.Element : fields.Element) || 'Neutral';
  const currentElementLevel = (pendingChanges.ElementLevel !== undefined ? pendingChanges.ElementLevel : fields.ElementLevel) || 1;
  const currentRaceGroups = (pendingChanges.RaceGroups !== undefined ? pendingChanges.RaceGroups : fields.RaceGroups) || {};

  const toggleRaceGroup = (group: string) => {
    const updated = { ...currentRaceGroups };
    if (updated[group]) {
      delete updated[group];
    } else {
      updated[group] = true;
    }
    setField('RaceGroups', Object.keys(updated).length > 0 ? updated : undefined);
  };

  return (
    <div className="space-y-3.5">
      {/* Primary Classification */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-2">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Classification &amp; Element
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Size */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Monster Size</label>
            <Select
              value={currentSize}
              onValueChange={(val) => setField('Size', val as MobSize)}
            >
              <SelectTrigger className="h-6.5 text-xs font-mono">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {MOB_SIZES.map((sz) => (
                  <SelectItem key={sz} value={sz}>
                    {sz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Race */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Monster Race</label>
            <Select
              value={currentRace}
              onValueChange={(val) => setField('Race', val as MobRace)}
            >
              <SelectTrigger className="h-6.5 text-xs font-mono">
                <SelectValue placeholder="Race" />
              </SelectTrigger>
              <SelectContent>
                {MOB_RACES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Element */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Element Attribute</label>
            <Select
              value={currentElement}
              onValueChange={(val) => setField('Element', val as MobElement)}
            >
              <SelectTrigger className="h-6.5 text-xs font-mono">
                <SelectValue placeholder="Element" />
              </SelectTrigger>
              <SelectContent>
                {MOB_ELEMENTS.map((el) => (
                  <SelectItem key={el} value={el}>
                    {el}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Element Level */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-neutral-400 font-medium">Element Level (1-4)</label>
            <Select
              value={String(currentElementLevel)}
              onValueChange={(val) => setField('ElementLevel', Number(val))}
            >
              <SelectTrigger className="h-6.5 text-xs font-mono">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((lvl) => (
                  <SelectItem key={lvl} value={String(lvl)}>
                    Level {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Secondary Race Groups */}
      <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Secondary Race Groups ({Object.keys(currentRaceGroups).length} active)
          </h3>
          {Object.keys(currentRaceGroups).length > 0 && (
            <button
              type="button"
              onClick={() => setField('RaceGroups', undefined)}
              className="text-[10px] text-red-400 hover:text-red-300 font-mono"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1 pt-0.5">
          {MOB_RACE_GROUPS.map((grp) => {
            const isSelected = Boolean(currentRaceGroups[grp]);
            return (
              <button
                key={grp}
                type="button"
                onClick={() => toggleRaceGroup(grp)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors border ${
                  isSelected
                    ? 'bg-sky-600/30 text-sky-200 border-sky-500/50 font-medium'
                    : 'bg-[#141416] text-neutral-400 hover:text-neutral-200 border-[#27272a]'
                }`}
              >
                {grp}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
