import { useEffect } from 'react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useProblemsStore, Problem } from '@/stores/problemsStore';
import { ItemDatabaseProvider } from '@/services/database/providers/itemDatabaseProvider';

export function ProblemScanner() {
  const itemMeta = useDatabaseStore((s) => s.metadataMap['item']);
  const registry = useDatabaseStore((s) => s.registry);
  const setProblems = useProblemsStore((s) => s.setProblems);
  const clearProblems = useProblemsStore((s) => s.clearProblems);

  useEffect(() => {
    if (itemMeta?.state === 'loaded' && registry) {
      const itemProvider = registry.getProvider('item') as ItemDatabaseProvider;
      const repository = itemProvider?.getRepository();
      
      if (repository) {
        const items = repository.getAllEffectiveItems();
        const foundProblems: Problem[] = [];

        for (const item of items) {
          const nameHasQuestionMark = item.fields.Name?.includes('?');
          const aegisNameHasQuestionMark = item.fields.AegisName?.includes('?');

          if (nameHasQuestionMark || aegisNameHasQuestionMark) {
            foundProblems.push({
              id: `item-${item.id}-qmark`,
              severity: 'warning',
              source: 'item',
              sourceId: item.id,
              message: `Item has '?' in its name: ${item.fields.Name || item.fields.AegisName}`
            });
          }
        }
        
        setProblems('item', foundProblems);
      }
    } else if (itemMeta?.state === 'not_loaded' || itemMeta?.state === 'error') {
      clearProblems('item');
    }
  }, [itemMeta, registry, setProblems, clearProblems]);

  return null;
}
