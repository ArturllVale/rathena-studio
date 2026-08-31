import { useState, useRef, useMemo } from 'react';
import { useItemEditStore } from '@/stores/itemEditStore';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import {
  ALL_SCRIPT_COMPLETIONS,
  ScriptCompletionItem,
} from '@/services/script/rathenaScriptDefinitions';
import { RathenaScriptValidator } from '@/services/script/rathenaScriptValidator';
import { Code, CheckCircle2, Wand2, Search, Plus, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MonacoScriptEditor } from '@/features/editor/monaco/MonacoScriptEditor';

interface ItemScriptEditorSectionProps {
  item: EffectiveItem;
}

type ScriptTab = 'Script' | 'EquipScript' | 'UnEquipScript';
type BonusCategory = 'All' | 'Stats' | 'Combat' | 'Cast & Delay' | 'Elements & Races' | 'Status & AutoSpell' | 'Heal & Recovery';

export function ItemScriptEditorSection({ item }: ItemScriptEditorSectionProps) {
  const { currentSession, setField } = useItemEditStore();
  const [activeTab, setActiveTab] = useState<ScriptTab>('Script');

  // Bonus Library Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BonusCategory>('All');
  const [showLibrary, setShowLibrary] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pendingChanges = currentSession?.getPendingChanges() || {};
  const fields = item.fields;

  const getScriptValue = (tab: ScriptTab): string => {
    if (pendingChanges[tab] !== undefined) {
      return pendingChanges[tab] || '';
    }
    return fields[tab] || '';
  };

  const isTabModified = (tab: ScriptTab): boolean => {
    return pendingChanges[tab] !== undefined;
  };

  const hasContent = (tab: ScriptTab): boolean => {
    const val = getScriptValue(tab);
    return Boolean(val && val.trim().length > 0);
  };

  const currentCode = getScriptValue(activeTab);
  const lineCount = currentCode ? currentCode.split('\n').length : 1;

  // Real-time Syntax Validation
  const syntaxIssues = useMemo(() => {
    return RathenaScriptValidator.validate(currentCode);
  }, [currentCode]);

  const insertBonusSnippet = (snippet: string) => {
    const prev = currentCode.trim();
    const next = prev ? `${prev}\n${snippet}` : snippet;
    setField(activeTab, next);

    if (textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = next.length;
        }
      }, 0);
    }
  };

  const insertCompletionItem = (item: ScriptCompletionItem) => {
    let snippet = item.detail;
    if (item.kind === 'bonus') {
      snippet = `bonus ${item.name}, 5;`;
      if (item.name.startsWith('bAdd') || item.name.startsWith('bSub') || item.name.startsWith('bSkill')) {
        snippet = `bonus2 ${item.name}, 0, 10;`;
      }
      if (item.name.includes('AutoSpell')) {
        snippet = `bonus3 ${item.name}, "AL_HEAL", 10, 1000;`;
      }
    } else if (item.kind === 'constant') {
      snippet = item.name;
    }
    insertBonusSnippet(snippet);
  };

  const autoFixSemicolons = () => {
    if (!currentCode) return;
    const lines = currentCode.split('\n');
    const fixedLines = lines.map((l) => {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.endsWith(';') || trimmed.endsWith('{') || trimmed.endsWith('}')) {
        return l;
      }
      return `${l};`;
    });
    setField(activeTab, fixedLines.join('\n'));
  };

  // Filtered bonuses for the library drawer
  const filteredBonuses = useMemo(() => {
    let list = ALL_SCRIPT_COMPLETIONS;

    if (selectedCategory === 'Stats') {
      list = list.filter((b) => b.name.startsWith('bStr') || b.name.startsWith('bAgi') || b.name.startsWith('bVit') || b.name.startsWith('bInt') || b.name.startsWith('bDex') || b.name.startsWith('bLuk') || b.name.startsWith('bAll') || b.name.startsWith('bPow') || b.name.startsWith('bSta') || b.name.startsWith('bWis') || b.name.startsWith('bSpl') || b.name.startsWith('bCon') || b.name.startsWith('bCrt'));
    } else if (selectedCategory === 'Combat') {
      list = list.filter((b) => b.name.includes('Atk') || b.name.includes('Def') || b.name.includes('Hit') || b.name.includes('Flee') || b.name.includes('Crit') || b.name.includes('Aspd') || b.name.includes('Range'));
    } else if (selectedCategory === 'Cast & Delay') {
      list = list.filter((b) => b.name.includes('Cast') || b.name.includes('Delay') || b.name.includes('Cooldown'));
    } else if (selectedCategory === 'Elements & Races') {
      list = list.filter((b) => b.name.includes('Ele') || b.name.includes('Race') || b.name.includes('Class') || b.name.includes('Size') || b.name.startsWith('Ele_') || b.name.startsWith('RC_'));
    } else if (selectedCategory === 'Status & AutoSpell') {
      list = list.filter((b) => b.name.includes('Eff') || b.name.includes('AutoSpell') || b.name.startsWith('Eff_') || b.name.startsWith('BF_') || b.name.startsWith('ATF_'));
    } else if (selectedCategory === 'Heal & Recovery') {
      list = list.filter((b) => b.name.includes('HP') || b.name.includes('SP') || b.name.includes('AP') || b.name.includes('Heal') || b.name.includes('Regen') || b.name === 'percentheal' || b.name === 'heal');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.documentation.toLowerCase().includes(q) ||
          b.detail.toLowerCase().includes(q)
      );
    }

    return list.slice(0, 30);
  }, [selectedCategory, searchQuery]);

  const categories: BonusCategory[] = [
    'All',
    'Stats',
    'Combat',
    'Cast & Delay',
    'Elements & Races',
    'Status & AutoSpell',
    'Heal & Recovery',
  ];

  if (!currentSession) return null;

  return (
    <div className="space-y-3">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          rAthena Scripts
        </h3>
        <div className="flex items-center gap-1 bg-[#141416] p-0.5 rounded border border-[#27272a]">
          {(['Script', 'EquipScript', 'UnEquipScript'] as ScriptTab[]).map((tab) => {
            const modified = isTabModified(tab);
            const active = activeTab === tab;
            const filled = hasContent(tab);

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  active
                    ? 'bg-sky-600 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {modified && <span className="w-1.5 h-1.5 rounded-full bg-sky-300" title="Modified" />}
                {!modified && filled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" title="Has script" />}
                <span>{tab === 'Script' ? 'Use / Script' : tab === 'EquipScript' ? 'OnEquip' : 'OnUnEquip'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Editor Box */}
      <div className="bg-[#141416] rounded border border-[#27272a] overflow-hidden flex flex-col focus-within:border-sky-500/50 transition-colors">
        {/* Editor Toolbar */}
        <div className="px-3 py-1.5 bg-[#1f1f23] border-b border-[#27272a] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-neutral-400 font-mono">
            <Code className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-neutral-200 font-medium">{activeTab}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-500">{lineCount} line{lineCount > 1 ? 's' : ''}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-500">{currentCode.length} chars</span>
          </div>

          <div className="flex items-center gap-2">
            {syntaxIssues.length === 0 && currentCode.trim().length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Valid Syntax
              </span>
            )}
            {syntaxIssues.length > 0 && (
              <button
                type="button"
                onClick={autoFixSemicolons}
                className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-mono px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-500/20"
                title="Auto-fix missing semicolons"
              >
                <Wand2 className="w-3 h-3" /> Auto-Fix Semicolons
              </button>
            )}
            {currentCode.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setField(activeTab, undefined)}
                className="text-[10px] text-red-400 hover:text-red-300 font-mono px-1.5 py-0.5 rounded hover:bg-red-950/20"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Code Editor Body */}
        <div className="p-2 bg-[#141416]">
          <MonacoScriptEditor
            value={currentCode}
            onChange={(val) => setField(activeTab, val === '' ? undefined : val)}
            height={180}
            validateScript={true}
          />
        </div>
      </div>

      {/* Bonus Reference & Quick Insert Drawer */}
      <div className="bg-[#18181b] rounded border border-[#27272a] overflow-hidden">
        <div 
          onClick={() => setShowLibrary(!showLibrary)}
          className="px-3 py-2 bg-[#1f1f23] border-b border-[#27272a] flex items-center justify-between cursor-pointer hover:bg-[#27272a] transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Bonus Library &amp; Quick Insert (item_bonus.txt)</span>
          </div>
          {showLibrary ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>

        {showLibrary && (
          <div className="p-3 space-y-2.5">
            {/* Search and Category Filter */}
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search bonus (e.g. str, crit, heal, cast, autospell, ele)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7 bg-[#141416] border-[#27272a] text-xs text-neutral-200"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      selectedCategory === cat
                        ? 'bg-sky-600 text-white font-medium'
                        : 'bg-[#141416] text-neutral-400 hover:text-neutral-200 border border-[#27272a]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Bonus Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredBonuses.map((b) => (
                <div
                  key={b.name}
                  className="p-2 rounded bg-[#141416] border border-[#27272a] hover:border-sky-500/40 flex items-start justify-between gap-2 group transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-xs text-neutral-100">{b.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono text-neutral-500 bg-[#1f1f23]">
                        {b.kind}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-sky-400 truncate mt-0.5">{b.detail}</div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5" title={b.documentation}>
                      {b.documentation}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => insertCompletionItem(b)}
                    className="p-1 rounded bg-[#1f1f23] hover:bg-sky-600 text-neutral-300 hover:text-white border border-[#27272a] hover:border-sky-500 flex items-center justify-center flex-shrink-0 transition-colors"
                    title={`Insert ${b.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {filteredBonuses.length === 0 && (
                <div className="col-span-2 text-center py-4 text-xs text-neutral-500">
                  No bonuses matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
