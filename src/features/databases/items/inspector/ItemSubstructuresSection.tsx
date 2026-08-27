import { useState } from 'react';
import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { 
  ITEM_DROP_EFFECTS, 
  ItemFlags, 
  ItemDelay, 
  ItemStack, 
  ItemNoUse, 
  ItemTrade, 
  ItemDropEffect 
} from '@/domain/database/item/itemTypes';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ItemSubstructuresSectionProps {
  item: EffectiveItem;
}

export function ItemSubstructuresSection({ item }: ItemSubstructuresSectionProps) {
  const { currentSession, setField } = useItemEditStore();
  const [flagsExpanded, setFlagsExpanded] = useState(false);
  const [tradeExpanded, setTradeExpanded] = useState(false);
  const [stackExpanded, setStackExpanded] = useState(false);
  const [delayExpanded, setDelayExpanded] = useState(false);
  const [noUseExpanded, setNoUseExpanded] = useState(false);

  if (!currentSession) return null;

  const pendingChanges = currentSession.getPendingChanges();
  const fields = item.fields;

  // Flags handling
  const currentFlags: ItemFlags = (pendingChanges.Flags !== undefined ? pendingChanges.Flags : fields.Flags) || {};
  const isFlagsModified = pendingChanges.Flags !== undefined;

  const updateFlags = <K extends keyof ItemFlags>(key: K, val: ItemFlags[K] | undefined) => {
    const updated: Record<string, unknown> = { ...currentFlags };
    if (val === undefined || val === false || (val as unknown) === '' || (val as unknown) === 'None') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    if (Object.keys(updated).length === 0) {
      setField('Flags', undefined);
    } else {
      setField('Flags', updated as ItemFlags);
    }
  };

  // Trade handling
  const currentTrade: ItemTrade = (pendingChanges.Trade !== undefined ? pendingChanges.Trade : fields.Trade) || {};
  const isTradeModified = pendingChanges.Trade !== undefined;

  const updateTrade = <K extends keyof ItemTrade>(key: K, val: ItemTrade[K] | undefined) => {
    const updated: Record<string, unknown> = { ...currentTrade };
    if (val === undefined || val === false || (val as unknown) === '') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    if (Object.keys(updated).length === 0) {
      setField('Trade', undefined);
    } else {
      setField('Trade', updated as ItemTrade);
    }
  };

  // Stack handling
  const currentStack: ItemStack = (pendingChanges.Stack !== undefined ? pendingChanges.Stack : fields.Stack) || {};
  const isStackModified = pendingChanges.Stack !== undefined;

  const updateStack = <K extends keyof ItemStack>(key: K, val: ItemStack[K] | undefined) => {
    const updated: Record<string, unknown> = { ...currentStack };
    if (val === undefined || val === false || (val as unknown) === '') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    if (Object.keys(updated).length === 0) {
      setField('Stack', undefined);
    } else {
      setField('Stack', updated as ItemStack);
    }
  };

  // Delay handling
  const currentDelay: ItemDelay = (pendingChanges.Delay !== undefined ? pendingChanges.Delay : fields.Delay) || {};
  const isDelayModified = pendingChanges.Delay !== undefined;

  const updateDelay = <K extends keyof ItemDelay>(key: K, val: ItemDelay[K] | undefined) => {
    const updated: Record<string, unknown> = { ...currentDelay };
    if (val === undefined || (val as unknown) === '') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    if (Object.keys(updated).length === 0) {
      setField('Delay', undefined);
    } else {
      setField('Delay', updated as ItemDelay);
    }
  };

  // NoUse handling
  const currentNoUse: ItemNoUse = (pendingChanges.NoUse !== undefined ? pendingChanges.NoUse : fields.NoUse) || {};
  const isNoUseModified = pendingChanges.NoUse !== undefined;

  const updateNoUse = <K extends keyof ItemNoUse>(key: K, val: ItemNoUse[K] | undefined) => {
    const updated: Record<string, unknown> = { ...currentNoUse };
    if (val === undefined || val === false || (val as unknown) === '') {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    if (Object.keys(updated).length === 0) {
      setField('NoUse', undefined);
    } else {
      setField('NoUse', updated as ItemNoUse);
    }
  };

  const renderSwitch = (label: string, checked: boolean, onChange: (checked: boolean) => void) => (
    <div className="flex items-center justify-between py-1 border-b border-[#27272a] last:border-0">
      <span className="text-xs text-neutral-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
          checked ? 'bg-sky-600' : 'bg-[#27272a]'
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Flags Section */}
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setFlagsExpanded(!flagsExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {flagsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isFlagsModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Item Flags
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {Object.keys(currentFlags).length === 0 ? 'None' : `${Object.keys(currentFlags).length} set`}
          </span>
        </button>

        {flagsExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-1.5">
            {renderSwitch('BuyingStore (Available in Buying Stores)', Boolean(currentFlags.BuyingStore), (v) => updateFlags('BuyingStore', v))}
            {renderSwitch('DeadBranch (Dead Branch spawn logic)', Boolean(currentFlags.DeadBranch), (v) => updateFlags('DeadBranch', v))}
            {renderSwitch('Container (Item package/box)', Boolean(currentFlags.Container), (v) => updateFlags('Container', v))}
            {renderSwitch('UniqueId (Unique GUID per stack)', Boolean(currentFlags.UniqueId), (v) => updateFlags('UniqueId', v))}
            {renderSwitch('BindOnEquip (Binds to character upon equipping)', Boolean(currentFlags.BindOnEquip), (v) => updateFlags('BindOnEquip', v))}
            {renderSwitch('DropAnnounce (Special drop broadcast)', Boolean(currentFlags.DropAnnounce), (v) => updateFlags('DropAnnounce', v))}
            {renderSwitch('NoConsume (Infinite use / not consumed)', Boolean(currentFlags.NoConsume), (v) => updateFlags('NoConsume', v))}

            <div className="flex items-center justify-between gap-2 py-1 pt-2 border-t border-[#27272a]">
              <span className="text-xs text-neutral-400">DropEffect</span>
              <select
                value={currentFlags.DropEffect || 'None'}
                onChange={(e) => updateFlags('DropEffect', (e.target.value as ItemDropEffect) || undefined)}
                className="text-xs font-mono bg-[#141416] border border-[#27272a] rounded px-2 py-1 w-32 text-neutral-200"
              >
                {ITEM_DROP_EFFECTS.map((eff) => (
                  <option key={eff} value={eff}>
                    {eff}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Trade Restrictions */}
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setTradeExpanded(!tradeExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {tradeExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isTradeModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Trade Restrictions (Trade)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {Object.keys(currentTrade).length === 0 ? 'Default' : `${Object.keys(currentTrade).length} rules`}
          </span>
        </button>

        {tradeExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-1.5">
            <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
              <span className="text-xs text-neutral-400">GM Override Group</span>
              <input
                type="number"
                placeholder="100"
                value={currentTrade.Override === undefined ? '' : String(currentTrade.Override)}
                onChange={(e) => updateTrade('Override', e.target.value === '' ? undefined : Number(e.target.value))}
                className="text-xs font-mono text-right bg-[#141416] border border-[#27272a] rounded px-2 py-1 w-24 text-neutral-200"
              />
            </div>
            {renderSwitch('NoDrop (Cannot drop on ground)', Boolean(currentTrade.NoDrop), (v) => updateTrade('NoDrop', v))}
            {renderSwitch('NoTrade (Cannot trade with players)', Boolean(currentTrade.NoTrade), (v) => updateTrade('NoTrade', v))}
            {renderSwitch('TradePartner (Cannot trade with marriage partner)', Boolean(currentTrade.TradePartner), (v) => updateTrade('TradePartner', v))}
            {renderSwitch('NoSell (Cannot sell to NPC)', Boolean(currentTrade.NoSell), (v) => updateTrade('NoSell', v))}
            {renderSwitch('NoCart (Cannot put in Pushcart)', Boolean(currentTrade.NoCart), (v) => updateTrade('NoCart', v))}
            {renderSwitch('NoStorage (Cannot put in Kafra Storage)', Boolean(currentTrade.NoStorage), (v) => updateTrade('NoStorage', v))}
            {renderSwitch('NoGuildStorage (Cannot put in Guild Storage)', Boolean(currentTrade.NoGuildStorage), (v) => updateTrade('NoGuildStorage', v))}
            {renderSwitch('NoMail (Cannot attach to Mail/RODEX)', Boolean(currentTrade.NoMail), (v) => updateTrade('NoMail', v))}
            {renderSwitch('NoAuction (Cannot put in Auction)', Boolean(currentTrade.NoAuction), (v) => updateTrade('NoAuction', v))}
          </div>
        )}
      </div>

      {/* Stack Settings */}
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setStackExpanded(!stackExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {stackExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isStackModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Stack Settings (Stack)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {currentStack.Amount ? `Max ${currentStack.Amount}` : 'Default'}
          </span>
        </button>

        {stackExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-1.5">
            <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
              <span className="text-xs text-neutral-400">Max Stack Amount</span>
              <input
                type="number"
                placeholder="None"
                value={currentStack.Amount === undefined ? '' : String(currentStack.Amount)}
                onChange={(e) => updateStack('Amount', e.target.value === '' ? undefined : Number(e.target.value))}
                className="text-xs font-mono text-right bg-[#141416] border border-[#27272a] rounded px-2 py-1 w-24 text-neutral-200"
              />
            </div>
            {renderSwitch('Apply to Inventory', currentStack.Inventory ?? true, (v) => updateStack('Inventory', v))}
            {renderSwitch('Apply to Cart', Boolean(currentStack.Cart), (v) => updateStack('Cart', v))}
            {renderSwitch('Apply to Storage', Boolean(currentStack.Storage), (v) => updateStack('Storage', v))}
            {renderSwitch('Apply to Guild Storage', Boolean(currentStack.GuildStorage), (v) => updateStack('GuildStorage', v))}
          </div>
        )}
      </div>

      {/* Delay Settings */}
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setDelayExpanded(!delayExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {delayExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isDelayModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Item Delay (Delay)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {currentDelay.Duration ? `${currentDelay.Duration}s` : 'None'}
          </span>
        </button>

        {delayExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-1.5">
            <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
              <span className="text-xs text-neutral-400">Duration (Seconds)</span>
              <input
                type="number"
                placeholder="0"
                value={currentDelay.Duration === undefined ? '' : String(currentDelay.Duration)}
                onChange={(e) => updateDelay('Duration', e.target.value === '' ? undefined : Number(e.target.value))}
                className="text-xs font-mono text-right bg-[#141416] border border-[#27272a] rounded px-2 py-1 w-24 text-neutral-200"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-neutral-400">Status Change ID</span>
              <input
                type="text"
                placeholder="None"
                value={currentDelay.Status || ''}
                onChange={(e) => updateDelay('Status', e.target.value || undefined)}
                className="text-xs font-mono text-right bg-[#141416] border border-[#27272a] rounded px-2 py-1 w-32 text-neutral-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* NoUse Restrictions */}
      <div className="bg-[#1f1f23] rounded border border-[#27272a] overflow-hidden">
        <button
          type="button"
          onClick={() => setNoUseExpanded(!noUseExpanded)}
          className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#27272a]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {noUseExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="text-xs font-medium text-neutral-200 flex items-center gap-1">
              {isNoUseModified && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Modified" />}
              Unusable Conditions (NoUse)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141416] text-neutral-400">
            {Object.keys(currentNoUse).length === 0 ? 'None' : `${Object.keys(currentNoUse).length} rules`}
          </span>
        </button>

        {noUseExpanded && (
          <div className="p-3 border-t border-[#27272a] bg-[#141416]/50 space-y-1.5">
            <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
              <span className="text-xs text-neutral-400">GM Override Group</span>
              <input
                type="number"
                placeholder="100"
                value={currentNoUse.Override === undefined ? '' : String(currentNoUse.Override)}
                onChange={(e) => updateNoUse('Override', e.target.value === '' ? undefined : Number(e.target.value))}
                className="text-xs font-mono text-right bg-[#141416] border border-[#27272a] rounded px-2 py-1 w-24 text-neutral-200"
              />
            </div>
            {renderSwitch('Sitting (Unusable while sitting)', Boolean(currentNoUse.Sitting), (v) => updateNoUse('Sitting', v))}
          </div>
        )}
      </div>
    </div>
  );
}
