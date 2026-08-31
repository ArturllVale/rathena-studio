import { EffectiveItemPackage } from '../itemPackage/effectiveItemPackage';
import { ItemPackageRawFields } from '../itemPackage/itemPackageTypes';

export type ItemPackagePendingChanges = Partial<ItemPackageRawFields>;

export interface ItemPackageEditCommand {
  field: keyof ItemPackageRawFields;
  previousValue: unknown;
  nextValue: unknown;
  execute(session: ItemPackageEditSession): void;
  undo(session: ItemPackageEditSession): void;
}

export class ItemPackageFieldEditCommand implements ItemPackageEditCommand {
  constructor(
    public readonly field: keyof ItemPackageRawFields,
    public readonly previousValue: unknown,
    public readonly nextValue: unknown
  ) {}

  public execute(session: ItemPackageEditSession): void {
    session.applyChange(this.field, this.nextValue);
  }

  public undo(session: ItemPackageEditSession): void {
    session.applyChange(this.field, this.previousValue);
  }
}

export class ItemPackageEditSession {
  public readonly packageName: string;
  public readonly originalPackage: EffectiveItemPackage;
  private pendingChanges: ItemPackagePendingChanges = {};

  private undoStack: ItemPackageEditCommand[] = [];
  private redoStack: ItemPackageEditCommand[] = [];

  constructor(pkg: EffectiveItemPackage) {
    this.packageName = pkg.package;
    this.originalPackage = pkg;
  }

  public clone(): ItemPackageEditSession {
    const cloned = new ItemPackageEditSession(this.originalPackage);
    cloned.pendingChanges = { ...this.pendingChanges };
    cloned.undoStack = [...this.undoStack];
    cloned.redoStack = [...this.redoStack];
    return cloned;
  }

  public getPendingChanges(): ItemPackagePendingChanges {
    return { ...this.pendingChanges };
  }

  public applyChange(field: keyof ItemPackageRawFields, value: unknown): void {
    const originalValue = this.originalPackage.fields[field];
    if (JSON.stringify(originalValue) === JSON.stringify(value)) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public setField<K extends keyof ItemPackageRawFields>(field: K, value: ItemPackageRawFields[K] | undefined): void {
    const currentValue = Object.prototype.hasOwnProperty.call(this.pendingChanges, field)
      ? this.pendingChanges[field]
      : this.originalPackage.fields[field];

    if (JSON.stringify(currentValue) === JSON.stringify(value)) {
      return;
    }

    const command = new ItemPackageFieldEditCommand(field, currentValue, value);
    command.execute(this);
    this.undoStack.push(command);
    this.redoStack = [];
  }

  public undo(): void {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop()!;
    command.undo(this);
    this.redoStack.push(command);
  }

  public redo(): void {
    if (this.redoStack.length === 0) return;
    const command = this.redoStack.pop()!;
    command.execute(this);
    this.undoStack.push(command);
  }

  public reset(): void {
    this.pendingChanges = {};
    this.undoStack = [];
    this.redoStack = [];
  }

  public get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public get isDirty(): boolean {
    return Object.keys(this.pendingChanges).length > 0;
  }

  public getEffectiveFields(): ItemPackageRawFields {
    return { ...this.originalPackage.fields, ...this.pendingChanges };
  }

  public getDiff(): Array<{ field: string; original: unknown; new: unknown }> {
    const diff: Array<{ field: string; original: unknown; new: unknown }> = [];
    for (const [key, newValue] of Object.entries(this.pendingChanges)) {
      diff.push({
        field: key,
        original: this.originalPackage.fields[key as keyof ItemPackageRawFields],
        new: newValue,
      });
    }
    return diff;
  }
}
