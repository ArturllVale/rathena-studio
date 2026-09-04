import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDatabaseStore } from '@/stores/databaseStore';
import { LayeredItemPackageRepository } from '@/services/database/itemPackage/layeredItemPackageRepository';
import { Package } from 'lucide-react';

export function ItemPackageVirtualList() {
  const { registry, selectedPackageName, setSelectedPackageName, itemPackageFilters } = useDatabaseStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const packageProvider = registry?.getProvider('package');
  const packageMeta = useDatabaseStore((s) => s.metadataMap['package']);
  const packages = useMemo(() => {
    if (!packageProvider || packageMeta?.state !== 'loaded') return [];
    const repository = packageProvider.getRepository() as LayeredItemPackageRepository | undefined;
    if (!repository || typeof repository.getAllEffectivePackages !== 'function') return [];
    return repository.getAllEffectivePackages();
  }, [packageProvider, packageMeta]);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (itemPackageFilters.query) {
        const q = itemPackageFilters.query.toLowerCase();
        const matchesName = pkg.package.toLowerCase().includes(q);
        const matchesRandom = pkg.fields.RandomOptions?.List.some((e) => String(e.Item).toLowerCase().includes(q));
        const matchesGroup = pkg.fields.Groups?.some((g) => (g.Items || g.List || []).some((e) => String(e.Item).toLowerCase().includes(q)));
        if (!matchesName && !matchesRandom && !matchesGroup) return false;
      }

      if (itemPackageFilters.folder) {
        const topLayer = pkg.layerProvenance[pkg.layerProvenance.length - 1];
        const isImport = topLayer.includes('import');
        if (itemPackageFilters.folder === 'import' && !isImport) return false;
        if (itemPackageFilters.folder === 'general' && isImport) return false;
      }

      return true;
    });
  }, [packages, itemPackageFilters]);

  const virtualizer = useVirtualizer({
    count: filteredPackages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  if (filteredPackages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
        <Package className="w-8 h-8 mb-2 opacity-30" />
        <span>No item packages match current filter criteria.</span>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto bg-background/50">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const pkg = filteredPackages[virtualRow.index];
          const isSelected = pkg.package === selectedPackageName;
          const isImport = pkg.layerProvenance[pkg.layerProvenance.length - 1]?.includes('import');

          return (
            <div
              key={pkg.package}
              onClick={() => setSelectedPackageName(pkg.package)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`flex items-center justify-between px-3.5 py-2 border-b border-border/40 cursor-pointer text-xs transition-colors ${
                isSelected
                  ? 'bg-pastel-blue/15 border-l-2 border-l-pastel-blue text-foreground font-medium'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Package className="w-4 h-4 text-pastel-lavender shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-medium truncate text-foreground">
                    {pkg.package}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate font-mono">
                    {pkg.fields.RandomOptions ? `Random Options (${pkg.fields.RandomOptions.List.length})` : ''}
                    {pkg.fields.Groups ? ` • Groups (${pkg.fields.Groups.length})` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                    isImport
                      ? 'bg-pastel-lavender/15 text-pastel-lavender border-pastel-lavender/30'
                      : 'bg-muted/60 text-muted-foreground border-border/70'
                  }`}
                >
                  {isImport ? 'IMPORT' : 'BASE'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
