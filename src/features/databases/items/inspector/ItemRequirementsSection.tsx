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
            className={`text-xs font-mono text-right bg-[#141416] border rounded px-1.5 py-0.5 h-6.5 w-14 shrink-0 ${
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
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Level & Gender Requirements
        </h3>
        <div className="bg-[#1f1f23] p-2.5 rounded border border-[#27272a] space-y-2">
          {renderField('Min Level (EquipLevelMin)', 'EquipLevelMin', 'number', '0')}
          {renderField('Max Level (EquipLevelMax)', 'EquipLevelMax', 'number', '0')}

          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#27272a]">
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              {isGenderModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Gender
            </span>
            <select
              value={currentGender}
              onChange={(e) => setField('Gender', e.target.value as GenderRestriction)}
              className={`text-xs font-mono bg-[#141416] border rounded px-2 py-1 w-32 ${
                isGenderModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'
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
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setJobsExpanded(!jobsExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {jobsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isJobsModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Job Restrictions
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {isJobsAll ? 'All Jobs' : `${Object.keys(currentJobs).length} selected`}
          </span>
        </button>

        {jobsExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Equip by All Jobs</span>
              <button
                type="button"
                onClick={toggleJobAll}
                className={`text-xs px-2.5 py-1 rounded font-mono ${
                  isJobsAll ? 'bg-sky-600 text-white' : 'bg-[#27272a] text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All: {isJobsAll ? 'true' : 'false'}
              </button>
            </div>

            {!isJobsAll && (
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {RATHENA_JOBS.map((j) => {
                  const checked = Boolean(currentJobs[j]);
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => toggleJob(j)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-left text-[11px] font-mono transition-colors ${
                        checked ? 'bg-sky-950/60 border border-sky-500/40 text-sky-200' : 'bg-[#1f1f23] border border-[#27272a] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded flex items-center justify-center border ${checked ? 'border-sky-500 bg-sky-600 text-white' : 'border-neutral-600'}`}>
                        {checked && <Check className="w-2.5 h-2.5" />}
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
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setClassesExpanded(!classesExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {classesExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isClassesModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Upper Class Types (Classes)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {isClassesAll ? 'All Classes' : `${Object.keys(currentClasses).length} selected`}
          </span>
        </button>

        {classesExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Equip by All Classes</span>
              <button
                type="button"
                onClick={toggleClassesAll}
                className={`text-xs px-2.5 py-1 rounded font-mono ${
                  isClassesAll ? 'bg-sky-600 text-white' : 'bg-[#27272a] text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All: {isClassesAll ? 'true' : 'false'}
              </button>
            </div>

            {!isClassesAll && (
              <div className="grid grid-cols-2 gap-1.5">
                {RATHENA_CLASSES.map((cls) => {
                  const checked = Boolean(currentClasses[cls]);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-left text-[11px] font-mono transition-colors ${
                        checked ? 'bg-sky-950/60 border border-sky-500/40 text-sky-200' : 'bg-[#1f1f23] border border-[#27272a] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded flex items-center justify-center border ${checked ? 'border-sky-500 bg-sky-600 text-white' : 'border-neutral-600'}`}>
                        {checked && <Check className="w-2.5 h-2.5" />}
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
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setLocationsExpanded(!locationsExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {locationsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isLocationsModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Equipment Placement (Locations)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {Object.keys(currentLocations).length === 0 ? 'None' : `${Object.keys(currentLocations).length} active`}
          </span>
        </button>

        {locationsExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50">
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {RATHENA_LOCATIONS.map((loc) => {
                const checked = Boolean(currentLocations[loc]);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-left text-[11px] font-mono transition-colors ${
                      checked ? 'bg-sky-950/60 border border-sky-500/40 text-sky-200' : 'bg-[#1f1f23] border border-[#27272a] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded flex items-center justify-center border ${checked ? 'border-sky-500 bg-sky-600 text-white' : 'border-neutral-600'}`}>
                      {checked && <Check className="w-2.5 h-2.5" />}
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
