import { EffectiveMob } from '../../domain/database/mob/effectiveMob';
import { MOB_ELEMENTS, MOB_RACES, MOB_SIZES, MOB_CLASSES } from '../../domain/database/mob/mobTypes';
import { ValidationIssue } from './itemDatabaseValidator';

export class MobDatabaseValidator {
  public validateEffectiveMob(mob: EffectiveMob): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const fields = mob.fields;
    const itemId = mob.id;

    // 1. Id validation
    if (!fields.Id || fields.Id <= 0 || !Number.isInteger(fields.Id)) {
      issues.push({
        itemId,
        field: 'Id',
        message: 'Monster ID must be a positive integer.',
        severity: 'error',
      });
    }

    // 2. AegisName validation
    if (!fields.AegisName || fields.AegisName.trim() === '') {
      issues.push({
        itemId,
        field: 'AegisName',
        message: 'AegisName is required.',
        severity: 'error',
      });
    } else if (/\s/.test(fields.AegisName)) {
      issues.push({
        itemId,
        field: 'AegisName',
        message: 'AegisName should not contain spaces.',
        severity: 'warning',
      });
    }

    // 3. Name validation
    if (!fields.Name || fields.Name.trim() === '') {
      issues.push({
        itemId,
        field: 'Name',
        message: 'Name is required.',
        severity: 'error',
      });
    }

    // 4. Level & Stats validation
    if (fields.Level !== undefined && (fields.Level < 1 || fields.Level > 999)) {
      issues.push({
        itemId,
        field: 'Level',
        message: 'Level should be between 1 and 999.',
        severity: 'warning',
      });
    }

    if (fields.Hp !== undefined && fields.Hp < 0) {
      issues.push({
        itemId,
        field: 'Hp',
        message: 'HP cannot be negative.',
        severity: 'error',
      });
    }

    // 5. Element / Race / Size / Class validation
    if (fields.Element && !MOB_ELEMENTS.includes(fields.Element)) {
      issues.push({
        itemId,
        field: 'Element',
        message: `Invalid Element "${fields.Element}".`,
        severity: 'error',
      });
    }

    if (fields.Race && !MOB_RACES.includes(fields.Race)) {
      issues.push({
        itemId,
        field: 'Race',
        message: `Invalid Race "${fields.Race}".`,
        severity: 'error',
      });
    }

    if (fields.Size && !MOB_SIZES.includes(fields.Size)) {
      issues.push({
        itemId,
        field: 'Size',
        message: `Invalid Size "${fields.Size}".`,
        severity: 'error',
      });
    }

    if (fields.Class && !MOB_CLASSES.includes(fields.Class)) {
      issues.push({
        itemId,
        field: 'Class',
        message: `Invalid Class "${fields.Class}".`,
        severity: 'error',
      });
    }

    // 6. Drops validation
    if (fields.Drops && Array.isArray(fields.Drops)) {
      for (let i = 0; i < fields.Drops.length; i++) {
        const drop = fields.Drops[i];
        if (!drop.Item || drop.Item.trim() === '') {
          issues.push({
            itemId,
            field: `Drops[${i}].Item`,
            message: `Drop item name at index ${i} cannot be empty.`,
            severity: 'error',
          });
        }
        if (drop.Rate === undefined || drop.Rate <= 0 || drop.Rate > 10000) {
          issues.push({
            itemId,
            field: `Drops[${i}].Rate`,
            message: `Drop rate at index ${i} must be between 1 and 10000 (10000 = 100%).`,
            severity: 'warning',
          });
        }
      }
    }

    // 7. MVP Drops validation
    if (fields.MvpDrops && Array.isArray(fields.MvpDrops)) {
      for (let i = 0; i < fields.MvpDrops.length; i++) {
        const drop = fields.MvpDrops[i];
        if (!drop.Item || drop.Item.trim() === '') {
          issues.push({
            itemId,
            field: `MvpDrops[${i}].Item`,
            message: `MVP Drop item name at index ${i} cannot be empty.`,
            severity: 'error',
          });
        }
        if (drop.Rate === undefined || drop.Rate <= 0 || drop.Rate > 10000) {
          issues.push({
            itemId,
            field: `MvpDrops[${i}].Rate`,
            message: `MVP Drop rate at index ${i} must be between 1 and 10000.`,
            severity: 'warning',
          });
        }
      }
    }

    return issues;
  }
}
