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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Cross-References & Linked Systems</span>
        </h3>
        <span className="text-[11px] font-mono text-neutral-400">
          {totalLinked} linked relation{totalLinked !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Item Combos Section */}
      <div className="bg-[#1f1f23] p-3 rounded border border-[#27272a] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Item Combos ({combos.length})</span>
          </div>
        </div>

        {combos.length === 0 ? (
          <div className="text-[11px] text-neutral-500 italic py-1">
            No item combos found containing this item.
          </div>
        ) : (
          <div className="space-y-2">
            {combos.map((combo) => (
              <div
                key={combo.key}
                className="p-2.5 rounded bg-[#141416] border border-[#27272a] text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {combo.fields.Combo.map((ci) => {
                    const isSelf = String(ci).toLowerCase() === String(item.fields.AegisName).toLowerCase() || String(ci) === String(item.id);
                    return (
                      <span
                        key={String(ci)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono border ${
                          isSelf
                            ? 'bg-sky-950/60 text-sky-300 border-sky-500/40 font-semibold'
                            : 'bg-[#1f1f23] text-neutral-300 border-[#27272a]'
                        }`}
                      >
                        {String(ci)}
                      </span>
                    );
                  })}
                </div>
                {combo.fields.Script && (
                  <pre className="font-mono text-[10px] bg-[#101012] p-1.5 rounded border border-[#27272a]/60 text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                    {combo.fields.Script}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Groups Section */}
      <div className="bg-[#1f1f23] p-3 rounded border border-[#27272a] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-200">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Item Groups & Boxes ({groups.length})</span>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-[11px] text-neutral-500 italic py-1">
            This item is not present in any Item Group / Random Box.
          </div>
        ) : (
          <div className="space-y-1.5">
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
                  className="p-2 rounded bg-[#141416] border border-[#27272a] text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-neutral-200 font-mono">{group.group}</span>
                    {group.subGroup !== undefined && (
                      <span className="text-[10px] text-neutral-400 ml-1.5">SubGroup: {group.subGroup}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                    {matchedEntries.map((m, idx) => (
                      <span key={idx} className="text-emerald-400">
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
      <div className="bg-[#1f1f23] p-3 rounded border border-[#27272a] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-200">
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>Item Packages ({packages.length})</span>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="text-[11px] text-neutral-500 italic py-1">
            This item is not contained in any Item Package.
          </div>
        ) : (
          <div className="space-y-1.5">
            {packages.map((pkg) => (
              <div
                key={pkg.key}
                className="p-2 rounded bg-[#141416] border border-[#27272a] text-xs flex items-center justify-between"
              >
                <span className="font-medium text-neutral-200 font-mono">{pkg.package}</span>
                <span className="text-[10px] text-neutral-400 font-mono">Package Bundle</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
