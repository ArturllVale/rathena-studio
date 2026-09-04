import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { Sparkles, Layers } from 'lucide-react';

export function ComboVirtualList() {
  const { registry, selectedComboKey, setSelectedComboKey, comboFilters } = useDatabaseStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const comboProvider = registry?.getProvider('combo');
  const comboMeta = useDatabaseStore((s) => s.metadataMap['combo']);
  const combos = useMemo(() => {
    if (!comboProvider || comboMeta?.state !== 'loaded') return [];
    const repository = comboProvider.getRepository() as LayeredComboRepository | undefined;
    if (!repository || typeof repository.getAllEffectiveCombos !== 'function') return [];
    return repository.getAllEffectiveCombos();
  }, [comboProvider, comboMeta]);

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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs p-6">
        <Sparkles className="w-8 h-8 mb-2 opacity-30 text-pastel-amber" />
        <span>No combos match current filter criteria.</span>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto bg-background">
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
              className={`flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 cursor-pointer text-xs transition-colors ${
                isSelected
                  ? 'bg-pastel-blue/15 border-l-2 border-l-pastel-blue text-foreground font-semibold'
                  : 'hover:bg-accent/40 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-pastel-amber shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-medium truncate text-foreground">
                    {combo.fields.Combo.join(' + ')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate font-mono">
                    {combo.fields.Script?.replace(/\n/g, ' ') || 'No script'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isImport
                      ? 'bg-lavender/15 text-lavender border-lavender/30 font-semibold'
                      : 'bg-secondary text-secondary-foreground border-border/80'
                  }`}
                >
                  {isImport ? 'IMPORT' : 'BASE'}
                </span>
                {combo.isOverridden && (
                  <span className="p-1 rounded-md bg-pastel-blue/15 text-pastel-blue" title="Overridden by Layer">
                    <Layers className="w-3.5 h-3.5" />
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
