import { EffectiveItemCombo } from '../combo/effectiveCombo';
import { ItemComboRawFields } from '../combo/comboTypes';

export type ComboPendingChanges = Partial<ItemComboRawFields>;

export interface ComboEditCommand {
  field: keyof ItemComboRawFields;
  previousValue: unknown;
  nextValue: unknown;
  execute(session: ComboEditSession): void;
  undo(session: ComboEditSession): void;
}

export class ComboFieldEditCommand implements ComboEditCommand {
  constructor(
    public readonly field: keyof ItemComboRawFields,
    public readonly previousValue: unknown,
    public readonly nextValue: unknown
  ) {}

  public execute(session: ComboEditSession): void {
    session.applyChange(this.field, this.nextValue);
  }

  public undo(session: ComboEditSession): void {
    session.applyChange(this.field, this.previousValue);
  }
}

export class ComboEditSession {
  public readonly comboKey: string;
  public readonly originalCombo: EffectiveItemCombo;
  private pendingChanges: ComboPendingChanges = {};

  private undoStack: ComboEditCommand[] = [];
  private redoStack: ComboEditCommand[] = [];

  constructor(combo: EffectiveItemCombo) {
    this.comboKey = combo.key;
    this.originalCombo = combo;
  }

  public clone(): ComboEditSession {
    const cloned = new ComboEditSession(this.originalCombo);
    cloned.pendingChanges = { ...this.pendingChanges };
    cloned.undoStack = [...this.undoStack];
    cloned.redoStack = [...this.redoStack];
    return cloned;
  }

  public getPendingChanges(): ComboPendingChanges {
    return { ...this.pendingChanges };
  }

  public applyChange(field: keyof ItemComboRawFields, value: unknown): void {
    const originalValue = this.originalCombo.fields[field];
    if (JSON.stringify(originalValue) === JSON.stringify(value)) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public setField<K extends keyof ItemComboRawFields>(field: K, value: ItemComboRawFields[K] | undefined): void {
    const currentValue = Object.prototype.hasOwnProperty.call(this.pendingChanges, field)
      ? this.pendingChanges[field]
      : this.originalCombo.fields[field];

    if (JSON.stringify(currentValue) === JSON.stringify(value)) {
      return;
    }

    const command = new ComboFieldEditCommand(field, currentValue, value);
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

  public getEffectiveFields(): ItemComboRawFields {
    return { ...this.originalCombo.fields, ...this.pendingChanges };
  }

  public getDiff(): Array<{ field: string; original: unknown; new: unknown }> {
    const diff: Array<{ field: string; original: unknown; new: unknown }> = [];
    for (const [key, newValue] of Object.entries(this.pendingChanges)) {
      diff.push({
        field: key,
        original: this.originalCombo.fields[key as keyof ItemComboRawFields],
        new: newValue,
      });
    }
    return diff;
  }
}
