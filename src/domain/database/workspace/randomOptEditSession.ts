import { EffectiveRandomOption, EffectiveRandomOptionGroup } from '../randomOpt/effectiveRandomOpt';
import { RandomOptionRawFields, RandomOptionGroupRawFields } from '../randomOpt/randomOptTypes';

export type RandomOptionPendingChanges = Partial<RandomOptionRawFields>;
export type RandomOptionGroupPendingChanges = Partial<RandomOptionGroupRawFields>;

export class RandomOptionEditSession {
  public readonly optionId: number;
  public readonly originalOption: EffectiveRandomOption;
  private pendingChanges: RandomOptionPendingChanges = {};

  constructor(opt: EffectiveRandomOption) {
    this.optionId = opt.id;
    this.originalOption = opt;
  }

  public getPendingChanges(): RandomOptionPendingChanges {
    return { ...this.pendingChanges };
  }

  public setField<K extends keyof RandomOptionRawFields>(field: K, value: RandomOptionRawFields[K] | undefined): void {
    const originalValue = this.originalOption.fields[field];
    if (JSON.stringify(originalValue) === JSON.stringify(value)) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public reset(): void {
    this.pendingChanges = {};
  }

  public get isDirty(): boolean {
    return Object.keys(this.pendingChanges).length > 0;
  }

  public getEffectiveFields(): RandomOptionRawFields {
    return { ...this.originalOption.fields, ...this.pendingChanges };
  }

  public getDiff(): Array<{ field: string; original: unknown; new: unknown }> {
    const diff: Array<{ field: string; original: unknown; new: unknown }> = [];
    for (const [key, newValue] of Object.entries(this.pendingChanges)) {
      diff.push({
        field: key,
        original: this.originalOption.fields[key as keyof RandomOptionRawFields],
        new: newValue,
      });
    }
    return diff;
  }
}

export class RandomOptionGroupEditSession {
  public readonly groupId: number;
  public readonly originalGroup: EffectiveRandomOptionGroup;
  private pendingChanges: RandomOptionGroupPendingChanges = {};

  constructor(grp: EffectiveRandomOptionGroup) {
    this.groupId = grp.id;
    this.originalGroup = grp;
  }

  public getPendingChanges(): RandomOptionGroupPendingChanges {
    return { ...this.pendingChanges };
  }

  public setField<K extends keyof RandomOptionGroupRawFields>(field: K, value: RandomOptionGroupRawFields[K] | undefined): void {
    const originalValue = this.originalGroup.fields[field];
    if (JSON.stringify(originalValue) === JSON.stringify(value)) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public reset(): void {
    this.pendingChanges = {};
  }

  public get isDirty(): boolean {
    return Object.keys(this.pendingChanges).length > 0;
  }

  public getEffectiveFields(): RandomOptionGroupRawFields {
    return { ...this.originalGroup.fields, ...this.pendingChanges };
  }

  public getDiff(): Array<{ field: string; original: unknown; new: unknown }> {
    const diff: Array<{ field: string; original: unknown; new: unknown }> = [];
    for (const [key, newValue] of Object.entries(this.pendingChanges)) {
      diff.push({
        field: key,
        original: this.originalGroup.fields[key as keyof RandomOptionGroupRawFields],
        new: newValue,
      });
    }
    return diff;
  }
}
