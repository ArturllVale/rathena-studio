import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { Sparkles, Layers } from 'lucide-react';

export function ComboVirtualList() {
  const { registry, selectedComboKey, setSelectedComboKey, comboFilters } = useDatabaseStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const comboProvider = registry?.getProvider('combo');
  const combos = useMemo(() => {
    if (!comboProvider) return [];
    const repository = comboProvider.getRepository() as LayeredComboRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveCombos !== 'function') return [];
    return repository.getAllEffectiveCombos();
  }, [comboProvider]);

  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      if (comboFilters.query) {
        const q = comboFilters.query.toLowerCase();
        const matchesKey = combo.key.toLowerCase().includes(q);
        const matchesScript = combo.fields.Script?.toLowerCase().includes(q);
        const matchesItem = combo.fields.Combo.some((item) => String(item).toLowerCase().includes(q));
        if (!matchesKey && !matchesScript && !matchesItem) return false;
      }

      if (comboFilters.folder) {
        const topLayer = combo.layerProvenance[combo.layerProvenance.length - 1];
        const isImport = topLayer.includes('import');
        if (comboFilters.folder === 'import' && !isImport) return false;
        if (comboFilters.folder === 'general' && isImport) return false;
      }

      return true;
    });
  }, [combos, comboFilters]);

  const virtualizer = useVirtualizer({
    count: filteredCombos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  if (filteredCombos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
        <Sparkles className="w-8 h-8 mb-2 opacity-30" />
        <span>No combos match current filter criteria.</span>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto bg-[#141416]">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const combo = filteredCombos[virtualRow.index];
          const isSelected = combo.key === selectedComboKey;
          const isImport = combo.layerProvenance[combo.layerProvenance.length - 1]?.includes('import');

          return (
            <div
              key={combo.key}
              onClick={() => setSelectedComboKey(combo.key)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`flex items-center justify-between px-3 py-2 border-b border-[#27272a]/60 cursor-pointer text-xs transition-colors ${
                isSelected
                  ? 'bg-sky-950/40 border-l-2 border-l-sky-500 text-neutral-100'
                  : 'hover:bg-[#1f1f23]/60 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-medium truncate text-neutral-200">
                    {combo.fields.Combo.join(' + ')}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate font-mono">
                    {combo.fields.Script?.replace(/\n/g, ' ') || 'No script'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    isImport
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                      : 'bg-[#1f1f23] text-neutral-400 border-[#27272a]'
                  }`}
                >
                  {isImport ? 'IMPORT' : 'BASE'}
                </span>
                {combo.isOverridden && (
                  <span className="p-0.5 rounded bg-sky-950 text-sky-400" title="Overridden by Layer">
                    <Layers className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
