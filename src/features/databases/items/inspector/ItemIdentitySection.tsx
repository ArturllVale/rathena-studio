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
      <div className="flex flex-col py-2.5 border-b border-border/50 last:border-0 relative">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1.5 font-medium">
            {isModified && <span className="w-2 h-2 rounded-full bg-pastel-blue" title="Modified" />}
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
            className={`text-sm font-mono text-right bg-card border rounded-lg px-3 py-1.5 h-9 shrink-0 transition-all ${
              isNum ? 'w-24' : 'w-48'
            } ${
              errorMsg
                ? 'border-destructive text-destructive bg-destructive/5'
                : isModified
                ? 'border-primary text-primary bg-primary/5'
                : 'border-border/80 text-foreground focus:border-primary/50'
            }`}
          />
        </div>
        {errorMsg && <div className="text-xs text-destructive mt-1 text-right font-medium">{errorMsg}</div>}
        {!isModified && origin && origin.layerId !== 'item-db-base-root' && origin.layerId !== layerProvenance[0] && (
          <div className="text-xs text-muted-foreground mt-1 text-right truncate font-mono opacity-80">
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
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Identification
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-2xs">
          {renderField('ID', 'Id', 'number')}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Identity & Names
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-2xs">
          {renderField('AegisName', 'AegisName', 'text')}
          {renderField('Name', 'Name', 'text')}
          {renderField('AliasName', 'AliasName', 'text', 'None')}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Classification & Appearance
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-2xs space-y-2">
          {/* Item Type Dropdown */}
          <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
              {isTypeModified && <span className="w-2 h-2 rounded-full bg-pastel-blue" title="Modified" />}
              Type
            </span>
            <div className="w-48 shrink-0">
              <Select
                value={currentType || 'Etc'}
                onValueChange={(val) => setField('Type', val as ItemType)}
              >
                <SelectTrigger
                  className={`h-9 text-sm font-mono ${
                    isTypeModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground'
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
          <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
              {isSubTypeModified && <span className="w-2 h-2 rounded-full bg-pastel-blue" title="Modified" />}
              SubType
            </span>
            <div className="w-48 shrink-0">
              {currentType === 'Weapon' ? (
                <Select
                  value={String(currentSubType) || 'none'}
                  onValueChange={(val) => setField('SubType', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger
                    className={`h-9 text-sm font-mono ${
                      isSubTypeModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground'
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
                    className={`h-9 text-sm font-mono ${
                      isSubTypeModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground'
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
                    className={`h-9 text-sm font-mono ${
                      isSubTypeModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground'
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
                  className={`text-sm font-mono text-right bg-card border rounded-lg px-3 py-1.5 h-9 w-48 transition-all ${
                    isSubTypeModified ? 'border-primary text-primary bg-primary/5' : 'border-border/80 text-foreground'
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
