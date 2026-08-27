import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { 
  ITEM_TYPES, 
  WEAPON_SUBTYPES, 
  AMMO_SUBTYPES, 
  CARD_SUBTYPES, 
  ItemType, 
  ItemRawFields 
} from '@/domain/database/item/itemTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ItemIdentitySectionProps {
  item: EffectiveItem;
}

export function ItemIdentitySection({ item }: ItemIdentitySectionProps) {
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
    type: 'text' | 'number' = 'text',
    placeholder?: string
  ) => {
    const origin = fieldOrigins[fieldName];
    const isModified = pendingChanges[fieldName] !== undefined;
    const effectiveValue = isModified ? pendingChanges[fieldName] : fields[fieldName];
    const errorMsg = getFieldError(fieldName);
    const isNum = type === 'number';

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
            className={`text-xs font-mono text-right bg-[#141416] border rounded px-2 py-0.5 h-6.5 shrink-0 ${
              isNum ? 'w-20 sm:w-24' : 'w-36'
            } ${
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

  const isTypeModified = pendingChanges.Type !== undefined;
  const currentType = isTypeModified ? pendingChanges.Type : fields.Type;

  const isSubTypeModified = pendingChanges.SubType !== undefined;
  const currentSubType = isSubTypeModified ? (pendingChanges.SubType || '') : (fields.SubType || '');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Identification
        </h3>
        <div className="bg-[#1f1f23] p-2.5 rounded border border-[#27272a]">
          {renderField('ID', 'Id', 'number')}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Identity & Names
        </h3>
        <div className="bg-[#1f1f23] p-2.5 rounded border border-[#27272a]">
          {renderField('AegisName', 'AegisName', 'text')}
          {renderField('Name', 'Name', 'text')}
          {renderField('AliasName', 'AliasName', 'text', 'None')}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Classification & Appearance
        </h3>
        <div className="bg-[#1f1f23] p-2.5 rounded border border-[#27272a] space-y-2">
          {/* Item Type Dropdown */}
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#27272a]">
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              {isTypeModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Type
            </span>
            <div className="w-36 shrink-0">
              <Select
                value={currentType || 'Etc'}
                onValueChange={(val) => setField('Type', val as ItemType)}
              >
                <SelectTrigger
                  className={`h-6.5 text-xs font-mono ${
                    isTypeModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                  }`}
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SubType Dropdown / Input */}
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#27272a]">
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              {isSubTypeModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              SubType
            </span>
            <div className="w-36 shrink-0">
              {currentType === 'Weapon' ? (
                <Select
                  value={String(currentSubType) || 'none'}
                  onValueChange={(val) => setField('SubType', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger
                    className={`h-6.5 text-xs font-mono ${
                      isSubTypeModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                    }`}
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {WEAPON_SUBTYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : currentType === 'Ammo' ? (
                <Select
                  value={String(currentSubType) || 'none'}
                  onValueChange={(val) => setField('SubType', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger
                    className={`h-6.5 text-xs font-mono ${
                      isSubTypeModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                    }`}
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {AMMO_SUBTYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : currentType === 'Card' ? (
                <Select
                  value={String(currentSubType) || 'none'}
                  onValueChange={(val) => setField('SubType', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger
                    className={`h-6.5 text-xs font-mono ${
                      isSubTypeModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                    }`}
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CARD_SUBTYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type="text"
                  placeholder="None"
                  value={String(currentSubType)}
                  onChange={(e) => setField('SubType', e.target.value || undefined)}
                  className={`text-xs font-mono text-right bg-[#141416] border rounded px-2 py-0.5 h-6.5 w-36 ${
                    isSubTypeModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
                  }`}
                />
              )}
            </div>
          </div>

          {renderField('View Sprite ID', 'View', 'number', 'None')}
        </div>
      </div>
    </div>
  );
}
