export type DatabaseVariant = 'RE' | 'PRE_RE';

export const DATABASE_VARIANTS: readonly DatabaseVariant[] = ['RE', 'PRE_RE'] as const;

export function isValidDatabaseVariant(value: unknown): value is DatabaseVariant {
  return value === 'RE' || value === 'PRE_RE';
}

export function normalizeDatabaseVariant(modeOrVariant: string): DatabaseVariant | null {
  const normalized = modeOrVariant.trim().toUpperCase();
  if (normalized === 'RE' || normalized === 'RENEWAL') {
    return 'RE';
  }
  if (normalized === 'PRE_RE' || normalized === 'PRE-RE' || normalized === 'PRERENEWAL' || normalized === 'PRE_RENEWAL') {
    return 'PRE_RE';
  }
  return null;
}

export function variantToModeString(variant: DatabaseVariant): 'Renewal' | 'Prerenewal' {
  return variant === 'RE' ? 'Renewal' : 'Prerenewal';
}
