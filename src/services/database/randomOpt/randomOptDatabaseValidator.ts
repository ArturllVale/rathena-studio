import { EffectiveRandomOption, EffectiveRandomOptionGroup } from '../../../domain/database/randomOpt/effectiveRandomOpt';
import { ValidationIssue } from '../itemDatabaseValidator';

export class RandomOptDatabaseValidator {
  public validateEffectiveOption(option: EffectiveRandomOption): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!option.fields.Id || option.fields.Id <= 0) {
      issues.push({
        field: 'Id',
        message: 'Random Option Id must be a positive integer.',
        severity: 'error',
      });
    }

    if (!option.fields.Option || option.fields.Option.trim() === '') {
      issues.push({
        field: 'Option',
        message: 'Random Option identifier is required.',
        severity: 'error',
      });
    }

    return issues;
  }

  public validateEffectiveGroup(group: EffectiveRandomOptionGroup): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!group.fields.Id || group.fields.Id <= 0) {
      issues.push({
        field: 'Id',
        message: 'Random Option Group Id must be a positive integer.',
        severity: 'error',
      });
    }

    if (!group.fields.Group || group.fields.Group.trim() === '') {
      issues.push({
        field: 'Group',
        message: 'Random Option Group name is required.',
        severity: 'error',
      });
    }

    if (!group.fields.Slots || group.fields.Slots.length === 0) {
      issues.push({
        field: 'Slots',
        message: 'Random Option Group should define at least one slot.',
        severity: 'warning',
      });
    }

    return issues;
  }
}
