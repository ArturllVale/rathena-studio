import { EffectiveSkill } from '../../domain/database/skill/effectiveSkill';
import { SKILL_TYPES, SKILL_TARGET_TYPES, SKILL_HIT_TYPES } from '../../domain/database/skill/skillTypes';
import { ValidationIssue } from './itemDatabaseValidator';

export class SkillDatabaseValidator {
  public validateEffectiveSkill(skill: EffectiveSkill): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const fields = skill.fields;
    const itemId = skill.id;

    // 1. Id validation
    if (!fields.Id || fields.Id <= 0 || !Number.isInteger(fields.Id)) {
      issues.push({
        itemId,
        field: 'Id',
        message: 'Skill ID must be a positive integer.',
        severity: 'error',
      });
    }

    // 2. Name validation (AegisName)
    if (!fields.Name || fields.Name.trim() === '') {
      issues.push({
        itemId,
        field: 'Name',
        message: 'Skill AegisName is required.',
        severity: 'error',
      });
    } else if (/\s/.test(fields.Name)) {
      issues.push({
        itemId,
        field: 'Name',
        message: 'Skill AegisName should not contain spaces.',
        severity: 'warning',
      });
    }

    // 3. MaxLevel validation
    if (fields.MaxLevel !== undefined && (fields.MaxLevel < 1 || fields.MaxLevel > 100)) {
      issues.push({
        itemId,
        field: 'MaxLevel',
        message: 'MaxLevel must be between 1 and 100.',
        severity: 'error',
      });
    }

    // 4. Type validation
    if (fields.Type && !SKILL_TYPES.includes(fields.Type)) {
      issues.push({
        itemId,
        field: 'Type',
        message: `Invalid Skill Type "${fields.Type}".`,
        severity: 'error',
      });
    }

    // 5. TargetType validation
    if (fields.TargetType && !SKILL_TARGET_TYPES.includes(fields.TargetType)) {
      issues.push({
        itemId,
        field: 'TargetType',
        message: `Invalid TargetType "${fields.TargetType}".`,
        severity: 'error',
      });
    }

    // 6. Hit validation
    if (fields.Hit && !SKILL_HIT_TYPES.includes(fields.Hit)) {
      issues.push({
        itemId,
        field: 'Hit',
        message: `Invalid Hit type "${fields.Hit}".`,
        severity: 'error',
      });
    }

    // 7. ItemCost validation
    if (fields.Requires?.ItemCost && Array.isArray(fields.Requires.ItemCost)) {
      for (let i = 0; i < fields.Requires.ItemCost.length; i++) {
        const cost = fields.Requires.ItemCost[i];
        if (!cost.Item || cost.Item.trim() === '') {
          issues.push({
            itemId,
            field: `Requires.ItemCost[${i}].Item`,
            message: `Required Item name at index ${i} cannot be empty.`,
            severity: 'error',
          });
        }
        if (cost.Amount === undefined || cost.Amount <= 0) {
          issues.push({
            itemId,
            field: `Requires.ItemCost[${i}].Amount`,
            message: `Required Item amount at index ${i} must be greater than 0.`,
            severity: 'error',
          });
        }
      }
    }

    return issues;
  }
}
