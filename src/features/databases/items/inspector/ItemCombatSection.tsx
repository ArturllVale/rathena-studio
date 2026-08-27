import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { ItemRawFields } from '@/domain/database/item/itemTypes';

interface ItemCombatSectionProps {
  item: EffectiveItem;
}

export function ItemCombatSection({ item }: ItemCombatSectionProps) {
  const { currentSession, setField, validationIssues } = useItemEditStore();
  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = item.fields;
  const fieldOrigins = item.fieldOrigins;
  const layerProvenance = item.layerProvenance;

  const getFieldError = (fieldName: string) => {
    return validationIssues.find(i => i.severity === 'error' && i.field === fieldName)?.message;
  };

  const renderField = (
    label: string,
    fieldName: keyof ItemRawFields,
    type: 'text' | 'number' = 'number',
    placeholder?: string
  ) => {
    const origin = fieldOrigins[fieldName];
    const isModified = pendingChanges[fieldName] !== undefined;
    const effectiveValue = isModified ? pendingChanges[fieldName] : fields[fieldName];
    const errorMsg = getFieldError(fieldName);

    return (
      <div className="flex flex-col py-1.5 border-b border-[#27272a] last:border-0 relative">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400 whitespace-nowrap flex items-center gap-1">
            {isModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
            {label}
          </span>
          <input
            type={type}
            placeholder={placeholder}
            value={effectiveValue === undefined || effectiveValue === null ? '' : String(effectiveValue)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setField(fieldName, undefined);
              } else if (type === 'number') {
                (setField as (f: keyof ItemRawFields, v: unknown) => void)(fieldName, Number(val));
              } else {
                (setField as (f: keyof ItemRawFields, v: unknown) => void)(fieldName, val);
              }
            }}
            className={`text-xs font-mono text-right bg-[#141416] border rounded px-2 py-0.5 h-6.5 w-20 sm:w-24 shrink-0 ${
              errorMsg
                ? 'border-red-500/50 text-red-200'
                : isModified
                ? 'border-sky-500/50 text-sky-200'
                : 'border-[#27272a] text-neutral-200'
            }`}
          />
        </div>
        {errorMsg && <div className="text-[10px] text-red-400 mt-1 text-right">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'item-db-base-root' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-neutral-500 mt-0.5 text-right truncate font-mono">
            via {origin.filePath || origin.layerId}
          </div>
        )}
      </div>
    );
  };

  const renderToggle = (label: string, fieldName: keyof ItemRawFields) => {
    const isModified = pendingChanges[fieldName] !== undefined;
    const effectiveValue = isModified ? Boolean(pendingChanges[fieldName]) : Boolean(fields[fieldName]);

    return (
      <div className="flex items-center justify-between py-1.5 border-b border-[#27272a] last:border-0">
        <span className="text-xs text-neutral-400 flex items-center gap-1">
          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
          {label}
        </span>
        <button
          type="button"
          onClick={() => (setField as (f: keyof ItemRawFields, v: unknown) => void)(fieldName, !effectiveValue)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            effectiveValue ? 'bg-sky-600' : 'bg-[#27272a]'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              effectiveValue ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Combat Stats & Modifiers
        </h3>
        <div className="bg-[#1f1f23] p-2.5 rounded border border-[#27272a]">
          {renderField('Physical Attack (Atk)', 'Attack', 'number', '0')}
          {renderField('Magic Attack (Matk)', 'MagicAttack', 'number', '0')}
          {renderField('Physical Defense (Def)', 'Defense', 'number', '0')}
          {renderField('Attack Range', 'Range', 'number', '0')}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Equipment Levels & Refinement
        </h3>
        <div className="bg-[#1f1f23] p-2.5 rounded border border-[#27272a]">
          {renderField('Weapon Level (1~5)', 'WeaponLevel', 'number', '0')}
          {renderField('Armor Level (1~2)', 'ArmorLevel', 'number', '0')}
          {renderToggle('Refineable', 'Refineable')}
          {renderToggle('Gradable (Grade Refine)', 'Gradable')}
        </div>
      </div>
    </div>
  );
}
