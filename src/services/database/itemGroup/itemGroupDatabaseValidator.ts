import { EffectiveItemGroup } from '../../../domain/database/itemGroup/effectiveItemGroup';
import { getItemGroupAllEntries } from '../../../domain/database/itemGroup/itemGroupTypes';
import { ValidationIssue } from '../itemDatabaseValidator';

export class ItemGroupDatabaseValidator {
  public validateEffectiveGroup(group: EffectiveItemGroup): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!group.fields.Group || group.fields.Group.trim() === '') {
      issues.push({
        field: 'Group',
        message: 'Group identifier is required.',
        severity: 'error',
      });
    }

    const allEntries = getItemGroupAllEntries(group.fields);
    if (allEntries.length === 0) {
      issues.push({
        field: 'List',
        message: 'Item group must contain at least one item entry.',
        severity: 'warning',
      });
    }

    for (let i = 0; i < allEntries.length; i++) {
      const entry = allEntries[i];
      if (!entry.Item) {
        issues.push({
          field: `Entry[${i}].Item`,
          message: `Entry at index ${i} is missing Item identifier.`,
          severity: 'error',
        });
      }
    }

    return issues;
  }
}
