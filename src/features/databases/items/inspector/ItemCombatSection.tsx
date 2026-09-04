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
      <div className="flex flex-col py-2.5 border-b border-border/60 last:border-0 relative">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
            {isModified && <span className="w-2 h-2 rounded-full bg-pastel-blue ring-2 ring-pastel-blue/20" title="Modified" />}
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
            className={`text-xs font-mono text-right bg-background border rounded-lg px-3 py-1.5 h-9 w-20 shrink-0 transition-colors focus:outline-none focus:ring-1 focus:ring-pastel-blue/40 ${
              errorMsg
                ? 'border-destructive/60 text-destructive'
                : isModified
                ? 'border-pastel-blue/80 text-pastel-blue font-semibold bg-pastel-blue/5'
                : 'border-border/80 text-foreground'
            }`}
          />
        </div>
        {errorMsg && <div className="text-[10px] text-destructive mt-1 text-right">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'item-db-base-root' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[10px] text-muted-foreground/80 mt-1 text-right truncate font-mono">
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
      <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {isModified && <span className="w-2 h-2 rounded-full bg-pastel-blue ring-2 ring-pastel-blue/20" title="Modified" />}
          {label}
        </span>
        <button
          type="button"
          onClick={() => (setField as (f: keyof ItemRawFields, v: unknown) => void)(fieldName, !effectiveValue)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-blue/30 ${
            effectiveValue ? 'bg-pastel-blue' : 'bg-secondary border border-border/80'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
              effectiveValue ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
          Combat Stats &amp; Modifiers
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs">
          {renderField('Physical Attack (Atk)', 'Attack', 'number', '0')}
          {renderField('Magic Attack (Matk)', 'MagicAttack', 'number', '0')}
          {renderField('Physical Defense (Def)', 'Defense', 'number', '0')}
          {renderField('Attack Range', 'Range', 'number', '0')}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
          Equipment Levels &amp; Refinement
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs">
          {renderField('Weapon Level (1~5)', 'WeaponLevel', 'number', '0')}
          {renderField('Armor Level (1~2)', 'ArmorLevel', 'number', '0')}
          {renderToggle('Refineable', 'Refineable')}
          {renderToggle('Gradable (Grade Refine)', 'Gradable')}
        </div>
      </div>
    </div>
  );
}
