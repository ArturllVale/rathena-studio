import { useMemo, useEffect, KeyboardEvent } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { ItemDatabaseValidator } from '@/services/database/itemDatabaseValidator';
import { ItemDatabaseSerializer } from '@/services/database/itemDatabaseSerializer';
import { ItemEditTransactionService } from '@/services/database/itemEditTransactionService';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { ItemRawFields } from '@/domain/database/item/itemTypes';
import { Loader2, Undo2, Redo2 } from 'lucide-react';

export function ItemInspector({ itemId }: { itemId: number }) {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const provider = useDatabaseStore(s => s.registry?.getProvider('item'));

  const { 
    currentSession, startSession, cancelSession, setField, 
    undo, redo,
    validationIssues, setValidationIssues, 
    commitError, setCommitError, 
    isCommitting, setIsCommitting 
  } = useItemEditStore();

  const item: EffectiveItem | undefined = useMemo(() => {
    if (!provider || !itemId) return undefined;
    const repository = provider.getRepository() as any;
    if (!repository || typeof repository.findById !== 'function') return undefined;
    return repository.findById(itemId);
  }, [provider, itemId]);

  // When item changes (e.g. selected another item), start a new session
  useEffect(() => {
    if (item) {
      startSession(item);
    } else {
      cancelSession();
    }
  }, [item, startSession, cancelSession]);

  // Validate on change
  useEffect(() => {
    if (!currentSession) return;
    const validator = new ItemDatabaseValidator();
    const service = new ItemEditTransactionService(validator, new ItemDatabaseSerializer(), {} as any);
    const issues = service.validateSession(currentSession);
    setValidationIssues(issues);
  }, [currentSession, setValidationIssues]);

  if (!item || !currentSession) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Item not found
      </div>
    );
  }

  const { fields, fieldOrigins, layerProvenance } = item;
  const pendingChanges = currentSession.getPendingChanges();
  const diffs = currentSession.getDiff();

  const handleSave = async () => {
    if (!activeWorkspace || !provider) return;
    
    setIsCommitting(true);
    setCommitError(null);
    
    try {
      const validator = new ItemDatabaseValidator();
      const serializer = new ItemDatabaseSerializer();
      const writer = new TauriFileContentWriter(activeWorkspace.rootPath);
      const service = new ItemEditTransactionService(validator, serializer, writer);
      
      await service.commitSession(currentSession, provider as any);
      
      // Reload UI state with newly committed item
      const repo = provider.getRepository() as any;
      const updatedItem = repo.findById(itemId);
      if (updatedItem) {
        startSession(updatedItem);
      }
    } catch (e) {
      setCommitError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCommitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      redo();
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationIssues.find(i => i.severity === 'error' && i.field === fieldName)?.message;
  };

  const renderField = (label: string, fieldName: keyof ItemRawFields, isEditable: boolean = false, type: 'text' | 'number' = 'text') => {
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
          {isEditable ? (
            <input 
              type={type}
              value={effectiveValue === undefined ? '' : String(effectiveValue)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setField(fieldName, undefined);
                } else if (type === 'number') {
                  setField(fieldName, Number(val) as any);
                } else {
                  setField(fieldName, val as any);
                }
              }}
              className={`text-xs font-mono text-right bg-[#141416] border rounded px-1.5 py-0.5 w-32 ${errorMsg ? 'border-red-500/50 text-red-200' : isModified ? 'border-sky-500/50 text-sky-200' : 'border-[#27272a] text-neutral-200'}`}
            />
          ) : (
            <span className="text-xs font-mono text-neutral-200 truncate">{effectiveValue === undefined ? '-' : String(effectiveValue)}</span>
          )}
        </div>
        {errorMsg && (
          <div className="text-[10px] text-red-400 mt-1 text-right">{errorMsg}</div>
        )}
        {!isModified && origin && origin.layerId !== 'item-db-base-root' && origin.layerId !== layerProvenance[0] && (
          <div className="text-[9px] text-neutral-500 mt-0.5 text-right truncate">
            via {origin.layerId}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#141416] outline-none" 
      tabIndex={-1} 
      onKeyDown={handleKeyDown}
    >
      <div className="p-4 border-b border-[#27272a] bg-[#1f1f23]">
        <div className="text-xl font-bold text-neutral-100">{fields.Name || 'Unknown'}</div>
        <div className="text-sm font-mono text-sky-400">{fields.AegisName || 'Unknown'}</div>
        <div className="text-xs text-neutral-500 mt-1">ID: {item.id}</div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {currentSession.isDirty && (
          <div className="bg-sky-950/20 p-3 rounded border border-sky-500/20">
            <h3 className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider mb-2">Semantic Diff</h3>
            <div className="space-y-1">
              {diffs.map(d => (
                <div key={d.field} className="text-xs font-mono">
                  <div className="text-neutral-300">{d.field}</div>
                  <div className="text-red-400 ml-2">- {String(d.original ?? 'undefined')}</div>
                  <div className="text-green-400 ml-2">+ {String(d.new ?? 'undefined')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {commitError && (
          <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-xs text-red-400 break-all">
            {commitError}
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Identity</h3>
          <div className="bg-[#1f1f23] p-2 rounded border border-[#27272a]">
            {renderField('AegisName', 'AegisName', true)}
            {renderField('Name', 'Name', true)}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Basic Info</h3>
          <div className="bg-[#1f1f23] p-2 rounded border border-[#27272a]">
            {renderField('Type', 'Type', true)}
            {renderField('SubType', 'SubType', true)}
            {renderField('Weight', 'Weight', true, 'number')}
            {renderField('Slots', 'Slots', true, 'number')}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Pricing</h3>
          <div className="bg-[#1f1f23] p-2 rounded border border-[#27272a]">
            {renderField('Buy', 'Buy', true, 'number')}
            {renderField('Sell', 'Sell', true, 'number')}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Equipment</h3>
          <div className="bg-[#1f1f23] p-2 rounded border border-[#27272a]">
            {renderField('Weapon Level', 'WeaponLevel', true, 'number')}
            {renderField('Armor Level', 'ArmorLevel', true, 'number')}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Provenance</h3>
          <div className="bg-[#1f1f23] p-2 rounded border border-[#27272a] space-y-1.5">
            {layerProvenance.map((layer, idx) => (
              <div key={layer} className="flex items-center gap-2 text-xs">
                <div className="w-3.5 h-3.5 rounded-full bg-[#27272a] flex items-center justify-center text-[8px] text-neutral-500">
                  {idx + 1}
                </div>
                <div className={`truncate ${idx === layerProvenance.length - 1 ? 'text-sky-400' : 'text-neutral-400'}`}>
                  {layer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#27272a] bg-[#1f1f23] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button 
            className={`p-1.5 rounded ${currentSession.canUndo ? 'text-neutral-300 hover:bg-[#27272a]' : 'text-neutral-600 cursor-not-allowed'}`}
            onClick={undo}
            disabled={!currentSession.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            className={`p-1.5 rounded ${currentSession.canRedo ? 'text-neutral-300 hover:bg-[#27272a]' : 'text-neutral-600 cursor-not-allowed'}`}
            onClick={redo}
            disabled={!currentSession.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            onClick={() => {
              cancelSession();
              startSession(item);
            }}
            disabled={!currentSession.isDirty || isCommitting}
          >
            Cancel
          </button>
          <button 
            className={`px-3 py-1.5 text-xs rounded flex items-center gap-1 ${currentSession.isDirty && validationIssues.length === 0 ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'}`}
            onClick={handleSave}
            disabled={!currentSession.isDirty || validationIssues.length > 0 || isCommitting}
          >
            {isCommitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
