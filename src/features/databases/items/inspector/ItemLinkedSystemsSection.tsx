import { useMemo } from 'react';
import { EffectiveItem } from '@/domain/database/item/effectiveItem';
import { useDatabaseStore } from '@/stores/databaseStore';
import { LayeredComboRepository } from '@/services/database/combo/layeredComboRepository';
import { LayeredItemGroupRepository } from '@/services/database/itemGroup/layeredItemGroupRepository';
import { LayeredItemPackageRepository } from '@/services/database/itemPackage/layeredItemPackageRepository';
import { getItemGroupAllEntries } from '@/domain/database/itemGroup/itemGroupTypes';
import { Link2, Layers, Package, Sparkles } from 'lucide-react';

export function ItemLinkedSystemsSection({ item }: { item: EffectiveItem }) {
  const { registry } = useDatabaseStore();

  const comboProvider = registry?.getProvider('combo');
  const groupProvider = registry?.getProvider('group');
  const packageProvider = registry?.getProvider('package');

  const combos = useMemo(() => {
    if (!comboProvider) return [];
    const repo = comboProvider.getRepository() as LayeredComboRepository | undefined;
    if (!repo || typeof repo.findCombosForItem !== 'function') return [];
    const fromId = repo.findCombosForItem(item.id);
    const fromAegis = item.fields.AegisName ? repo.findCombosForItem(item.fields.AegisName) : [];
    const map = new Map<string, typeof fromId[0]>();
    for (const c of [...fromId, ...fromAegis]) {
      map.set(c.key, c);
    }
    return Array.from(map.values());
  }, [comboProvider, item.id, item.fields.AegisName]);

  const groups = useMemo(() => {
    if (!groupProvider) return [];
    const repo = groupProvider.getRepository() as LayeredItemGroupRepository | undefined;
    if (!repo || typeof repo.findGroupsContainingItem !== 'function') return [];
    const fromId = repo.findGroupsContainingItem(item.id);
    const fromAegis = item.fields.AegisName ? repo.findGroupsContainingItem(item.fields.AegisName) : [];
    const map = new Map<string, typeof fromId[0]>();
    for (const g of [...fromId, ...fromAegis]) {
      map.set(g.key, g);
    }
    return Array.from(map.values());
  }, [groupProvider, item.id, item.fields.AegisName]);

  const packages = useMemo(() => {
    if (!packageProvider) return [];
    const repo = packageProvider.getRepository() as LayeredItemPackageRepository | undefined;
    if (!repo || typeof repo.findPackagesContainingItem !== 'function') return [];
    const fromId = repo.findPackagesContainingItem(item.id);
    const fromAegis = item.fields.AegisName ? repo.findPackagesContainingItem(item.fields.AegisName) : [];
    const map = new Map<string, typeof fromId[0]>();
    for (const p of [...fromId, ...fromAegis]) {
      map.set(p.key, p);
    }
    return Array.from(map.values());
  }, [packageProvider, item.id, item.fields.AegisName]);

  const totalLinked = combos.length + groups.length + packages.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Link2 className="w-4 h-4 text-pastel-blue" />
          <span>Cross-References &amp; Linked Systems</span>
        </h3>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {totalLinked} linked relation{totalLinked !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Item Combos Section */}
      <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-pastel-amber" />
            <span>Active Item Combos ({combos.length})</span>
          </div>
        </div>

        {combos.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-1">
            No item combos found containing this item.
          </div>
        ) : (
          <div className="space-y-2.5">
            {combos.map((combo) => (
              <div
                key={combo.key}
                className="p-3 rounded-lg bg-background border border-border/80 text-xs space-y-2 shadow-2xs"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {combo.fields.Combo.map((ci) => {
                    const isSelf = String(ci).toLowerCase() === String(item.fields.AegisName).toLowerCase() || String(ci) === String(item.id);
                    return (
                      <span
                        key={String(ci)}
                        className={`px-2 py-0.5 rounded-md text-xs font-mono border ${
                          isSelf
                            ? 'bg-pastel-blue/15 text-pastel-blue border-pastel-blue/40 font-semibold'
                            : 'bg-secondary text-secondary-foreground border-border/80'
                        }`}
                      >
                        {String(ci)}
                      </span>
                    );
                  })}
                </div>
                {combo.fields.Script && (
                  <pre className="font-mono text-xs bg-muted/40 p-2.5 rounded-md border border-border/60 text-foreground whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {combo.fields.Script}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Groups Section */}
      <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Layers className="w-4 h-4 text-mint" />
            <span>Item Groups &amp; Boxes ({groups.length})</span>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-1">
            This item is not present in any Item Group / Random Box.
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const allEntries = getItemGroupAllEntries(group.fields);
              const matchedEntries = allEntries.filter(
                (e) =>
                  String(e.Item).toLowerCase() === String(item.fields.AegisName).toLowerCase() ||
                  String(e.Item) === String(item.id)
              );
              return (
                <div
                  key={group.key}
                  className="p-3 rounded-lg bg-background border border-border/80 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <span className="font-semibold text-foreground font-mono">{group.group}</span>
                    {group.subGroup !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">SubGroup: {group.subGroup}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    {matchedEntries.map((m, idx) => (
                      <span key={idx} className="text-mint font-medium">
                        {m.Rate !== undefined ? `Rate: ${m.Rate / 100}% ` : ''}
                        {m.Amount ? `(x${m.Amount})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Packages Section */}
      <div className="bg-card p-4 rounded-xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Package className="w-4 h-4 text-lavender" />
            <span>Item Packages ({packages.length})</span>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-1">
            This item is not contained in any Item Package.
          </div>
        ) : (
          <div className="space-y-2">
            {packages.map((pkg) => (
              <div
                key={pkg.key}
                className="p-3 rounded-lg bg-background border border-border/80 text-xs flex items-center justify-between shadow-2xs"
              >
                <span className="font-semibold text-foreground font-mono">{pkg.package}</span>
                <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-secondary">Package Bundle</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
