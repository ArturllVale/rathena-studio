import { EffectiveItemCombo } from '../../../domain/database/combo/effectiveCombo';
import { ValidationIssue } from '../itemDatabaseValidator';

export class ComboDatabaseValidator {
  public validateEffectiveCombo(combo: EffectiveItemCombo): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!combo.fields.Combo || combo.fields.Combo.length < 2) {
      issues.push({
        field: 'Combo',
        message: 'A combo must contain at least 2 items.',
        severity: 'error',
      });
    }

    if (combo.fields.Combo) {
      const set = new Set(combo.fields.Combo.map((i) => String(i).toLowerCase()));
      if (set.size !== combo.fields.Combo.length) {
        issues.push({
          field: 'Combo',
          message: 'Combo items contains duplicate entries.',
          severity: 'warning',
        });
      }
    }

    return issues;
  }
}
