import { useState } from 'react';
import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { 
  GENDER_RESTRICTIONS, 
  RATHENA_JOBS, 
  RATHENA_CLASSES, 
  RATHENA_LOCATIONS,
  GenderRestriction,
  ItemJobs,
  ItemClasses,
  ItemLocations,
  ItemRawFields
} from '@/domain/database/item/itemTypes';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

interface ItemRequirementsSectionProps {
  item: EffectiveItem;
}

export function ItemRequirementsSection({ item }: ItemRequirementsSectionProps) {
  const { currentSession, setField, validationIssues } = useItemEditStore();
  const [jobsExpanded, setJobsExpanded] = useState(false);
  const [classesExpanded, setClassesExpanded] = useState(false);
  const [locationsExpanded, setLocationsExpanded] = useState(false);

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

  const currentGender: GenderRestriction = (pendingChanges.Gender !== undefined ? pendingChanges.Gender : fields.Gender) || 'Both';
  const isGenderModified = pendingChanges.Gender !== undefined;

  // Jobs handling
  const currentJobs: ItemJobs = (pendingChanges.Jobs !== undefined ? pendingChanges.Jobs : fields.Jobs) || { All: true };
  const isJobsModified = pendingChanges.Jobs !== undefined;
  const isJobsAll = currentJobs.All === true || Object.keys(currentJobs).length === 0;

  const toggleJobAll = () => {
    if (isJobsAll) {
      setField('Jobs', { Novice: true });
    } else {
      setField('Jobs', { All: true });
    }
  };

  const toggleJob = (job: string) => {
    const updated = { ...currentJobs };
    delete updated.All;
    if (updated[job]) {
      delete updated[job];
    } else {
      updated[job] = true;
    }
    if (Object.keys(updated).length === 0) {
      setField('Jobs', { All: true });
    } else {
      setField('Jobs', updated);
    }
  };

  // Classes handling
  const currentClasses: ItemClasses = (pendingChanges.Classes !== undefined ? pendingChanges.Classes : fields.Classes) || { All: true };
  const isClassesModified = pendingChanges.Classes !== undefined;
  const isClassesAll = currentClasses.All === true || Object.keys(currentClasses).length === 0;

  const toggleClassesAll = () => {
    if (isClassesAll) {
      setField('Classes', { Normal: true });
    } else {
      setField('Classes', { All: true });
    }
  };

  const toggleClass = (cls: string) => {
    const updated = { ...currentClasses };
    delete updated.All;
    if (updated[cls]) {
      delete updated[cls];
    } else {
      updated[cls] = true;
    }
    if (Object.keys(updated).length === 0) {
      setField('Classes', { All: true });
    } else {
      setField('Classes', updated);
    }
  };

  // Locations handling
  const currentLocations: ItemLocations = (pendingChanges.Locations !== undefined ? pendingChanges.Locations : fields.Locations) || {};
  const isLocationsModified = pendingChanges.Locations !== undefined;

  const toggleLocation = (loc: string) => {
    const updated = { ...currentLocations };
    if (updated[loc]) {
      delete updated[loc];
    } else {
      updated[loc] = true;
    }
    if (Object.keys(updated).length === 0) {
      setField('Locations', undefined);
    } else {
      setField('Locations', updated);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
          Level &amp; Gender Requirements
        </h3>
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs space-y-1">
          {renderField('Min Level (EquipLevelMin)', 'EquipLevelMin', 'number', '0')}
          {renderField('Max Level (EquipLevelMax)', 'EquipLevelMax', 'number', '0')}

          <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/60 last:border-0">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              {isGenderModified && <span className="w-2 h-2 rounded-full bg-pastel-blue ring-2 ring-pastel-blue/20" title="Modified" />}
              Gender
            </span>
            <select
              value={currentGender}
              onChange={(e) => setField('Gender', e.target.value as GenderRestriction)}
              className={`text-xs font-mono bg-background border rounded-lg px-3 py-1.5 h-9 w-36 transition-colors focus:outline-none focus:ring-1 focus:ring-pastel-blue/40 ${
                isGenderModified ? 'border-pastel-blue/80 text-pastel-blue font-semibold bg-pastel-blue/5' : 'border-border/80 text-foreground'
              }`}
            >
              {GENDER_RESTRICTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Restriction */}
      <div className="bg-card rounded-xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setJobsExpanded(!jobsExpanded)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-accent/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {jobsExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {isJobsModified && <span className="w-2 h-2 rounded-full bg-pastel-blue ring-2 ring-pastel-blue/20" title="Modified" />}
              Job Restrictions
            </span>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {isJobsAll ? 'All Jobs' : `${Object.keys(currentJobs).length} selected`}
          </span>
        </button>

        {jobsExpanded && (
          <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Equip by All Jobs</span>
              <button
                type="button"
                onClick={toggleJobAll}
                className={`text-xs px-3 py-1 rounded-lg font-mono transition-colors ${
                  isJobsAll ? 'bg-pastel-blue text-pastel-blue-foreground font-semibold shadow-xs' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All: {isJobsAll ? 'true' : 'false'}
              </button>
            </div>

            {!isJobsAll && (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {RATHENA_JOBS.map((j) => {
                  const checked = Boolean(currentJobs[j]);
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => toggleJob(j)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-colors ${
                        checked ? 'bg-pastel-blue/15 border border-pastel-blue/40 text-pastel-blue font-semibold' : 'bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${checked ? 'border-pastel-blue bg-pastel-blue text-pastel-blue-foreground' : 'border-border bg-background'}`}>
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{j}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Classes Restriction */}
      <div className="bg-card rounded-xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setClassesExpanded(!classesExpanded)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-accent/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {classesExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {isClassesModified && <span className="w-2 h-2 rounded-full bg-pastel-blue ring-2 ring-pastel-blue/20" title="Modified" />}
              Upper Class Types (Classes)
            </span>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {isClassesAll ? 'All Classes' : `${Object.keys(currentClasses).length} selected`}
          </span>
        </button>

        {classesExpanded && (
          <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Equip by All Classes</span>
              <button
                type="button"
                onClick={toggleClassesAll}
                className={`text-xs px-3 py-1 rounded-lg font-mono transition-colors ${
                  isClassesAll ? 'bg-pastel-blue text-pastel-blue-foreground font-semibold shadow-xs' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All: {isClassesAll ? 'true' : 'false'}
              </button>
            </div>

            {!isClassesAll && (
              <div className="grid grid-cols-2 gap-2">
                {RATHENA_CLASSES.map((cls) => {
                  const checked = Boolean(currentClasses[cls]);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-colors ${
                        checked ? 'bg-pastel-blue/15 border border-pastel-blue/40 text-pastel-blue font-semibold' : 'bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${checked ? 'border-pastel-blue bg-pastel-blue text-pastel-blue-foreground' : 'border-border bg-background'}`}>
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{cls}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Equipment Locations */}
      <div className="bg-card rounded-xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setLocationsExpanded(!locationsExpanded)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-accent/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {locationsExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {isLocationsModified && <span className="w-2 h-2 rounded-full bg-pastel-blue ring-2 ring-pastel-blue/20" title="Modified" />}
              Equipment Placement (Locations)
            </span>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {Object.keys(currentLocations).length === 0 ? 'None' : `${Object.keys(currentLocations).length} active`}
          </span>
        </button>

        {locationsExpanded && (
          <div className="p-4 border-t border-border/60 bg-muted/20">
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {RATHENA_LOCATIONS.map((loc) => {
                const checked = Boolean(currentLocations[loc]);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-colors ${
                      checked ? 'bg-pastel-blue/15 border border-pastel-blue/40 text-pastel-blue font-semibold' : 'bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${checked ? 'border-pastel-blue bg-pastel-blue text-pastel-blue-foreground' : 'border-border bg-background'}`}>
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className="truncate">{loc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
