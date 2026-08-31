import { EffectiveItemPackage } from '../../../domain/database/itemPackage/effectiveItemPackage';
import { ValidationIssue } from '../itemDatabaseValidator';

export class ItemPackageDatabaseValidator {
  public validateEffectivePackage(pkg: EffectiveItemPackage): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!pkg.fields.Package || pkg.fields.Package.trim() === '') {
      issues.push({
        field: 'Package',
        message: 'Package name/identifier is required.',
        severity: 'error',
      });
    }

    if (!pkg.fields.RandomOptions && (!pkg.fields.Groups || pkg.fields.Groups.length === 0)) {
      issues.push({
        field: 'Package',
        message: 'Package should contain either RandomOptions or Groups.',
        severity: 'warning',
      });
    }

    return issues;
  }
}
