export interface ItemComboRawFields {
  Combo: (string | number)[];
  Script?: string;
}

export function normalizeComboKey(comboItems: (string | number)[]): string {
  if (!comboItems || !Array.isArray(comboItems)) return '';
  return [...comboItems]
    .map((item) => String(item).trim())
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .join(' + ');
}
