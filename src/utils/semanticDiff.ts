export interface DiffEntry {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue: unknown;
  newValue: unknown;
  formattedOld: string;
  formattedNew: string;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function formatValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
    return String(val);
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    // Check if it's an array of level matrix objects e.g. { Level: 1, Time: 100 }
    if (val.every((item) => isPlainObject(item) && 'Level' in item)) {
      return val
        .map((item) => {
          const keys = Object.keys(item).filter((k) => k !== 'Level');
          const valStr = keys.map((k) => `${k}: ${String(item[k])}`).join(', ');
          return `Lv.${item.Level} (${valStr})`;
        })
        .join(', ');
    }
    return JSON.stringify(val);
  }
  if (isPlainObject(val)) {
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(', ');
  }
  return String(val);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined || a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export function computeSemanticDiff(
  originalObj: Record<string, unknown>,
  pendingChanges: Record<string, unknown>,
  prefix = ''
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  for (const [key, newVal] of Object.entries(pendingChanges)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const oldVal = originalObj ? originalObj[key] : undefined;

    if (deepEqual(oldVal, newVal)) {
      continue;
    }

    if (oldVal === undefined && newVal !== undefined) {
      diffs.push({
        path: fullPath,
        type: 'added',
        oldValue: oldVal,
        newValue: newVal,
        formattedOld: '',
        formattedNew: formatValue(newVal),
      });
    } else if (oldVal !== undefined && newVal === undefined) {
      diffs.push({
        path: fullPath,
        type: 'removed',
        oldValue: oldVal,
        newValue: newVal,
        formattedOld: formatValue(oldVal),
        formattedNew: '',
      });
    } else if (isPlainObject(oldVal) && isPlainObject(newVal)) {
      // Recurse into nested objects
      const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));
      const nestedPending: Record<string, unknown> = {};
      for (const k of allKeys) {
        if (!deepEqual(oldVal[k], newVal[k])) {
          nestedPending[k] = newVal[k];
        }
      }
      const nestedDiffs = computeSemanticDiff(
        oldVal as Record<string, unknown>,
        nestedPending,
        fullPath
      );
      diffs.push(...nestedDiffs);
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      // Check if both are level matrices
      const isOldMatrix = oldVal.every((item) => isPlainObject(item) && 'Level' in item);
      const isNewMatrix = newVal.every((item) => isPlainObject(item) && 'Level' in item);

      if (isOldMatrix && isNewMatrix) {
        const maxLen = Math.max(oldVal.length, newVal.length);
        let hasItemDiff = false;
        for (let i = 0; i < maxLen; i++) {
          const o = oldVal[i];
          const n = newVal[i];
          if (!deepEqual(o, n)) {
            hasItemDiff = true;
            const lvl = n?.Level || o?.Level || i + 1;
            diffs.push({
              path: `${fullPath}[Lv.${lvl}]`,
              type: o === undefined ? 'added' : n === undefined ? 'removed' : 'modified',
              oldValue: o,
              newValue: n,
              formattedOld: formatValue(o),
              formattedNew: formatValue(n),
            });
          }
        }
        if (!hasItemDiff) {
          diffs.push({
            path: fullPath,
            type: 'modified',
            oldValue: oldVal,
            newValue: newVal,
            formattedOld: formatValue(oldVal),
            formattedNew: formatValue(newVal),
          });
        }
      } else {
        diffs.push({
          path: fullPath,
          type: 'modified',
          oldValue: oldVal,
          newValue: newVal,
          formattedOld: formatValue(oldVal),
          formattedNew: formatValue(newVal),
        });
      }
    } else {
      diffs.push({
        path: fullPath,
        type: 'modified',
        oldValue: oldVal,
        newValue: newVal,
        formattedOld: formatValue(oldVal),
        formattedNew: formatValue(newVal),
      });
    }
  }

  return diffs;
}
