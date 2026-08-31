import { EffectiveItemGroup } from '../itemGroup/effectiveItemGroup';
import { ItemGroupRawFields, getItemGroupAllEntries } from '../itemGroup/itemGroupTypes';

export type ItemGroupPendingChanges = Partial<ItemGroupRawFields>;

export interface ItemGroupEditCommand {
  field: keyof ItemGroupRawFields;
  previousValue: unknown;
  nextValue: unknown;
  execute(session: ItemGroupEditSession): void;
  undo(session: ItemGroupEditSession): void;
}

export class ItemGroupFieldEditCommand implements ItemGroupEditCommand {
  constructor(
    public readonly field: keyof ItemGroupRawFields,
    public readonly previousValue: unknown,
    public readonly nextValue: unknown
  ) {}

  public execute(session: ItemGroupEditSession): void {
    session.applyChange(this.field, this.nextValue);
  }

  public undo(session: ItemGroupEditSession): void {
    session.applyChange(this.field, this.previousValue);
  }
}

export class ItemGroupEditSession {
  public readonly groupKey: string;
  public readonly originalGroup: EffectiveItemGroup;
  private pendingChanges: ItemGroupPendingChanges = {};

  private undoStack: ItemGroupEditCommand[] = [];
  private redoStack: ItemGroupEditCommand[] = [];

  constructor(group: EffectiveItemGroup) {
    this.groupKey = group.key;
    this.originalGroup = group;
  }

  public clone(): ItemGroupEditSession {
    const cloned = new ItemGroupEditSession(this.originalGroup);
    cloned.pendingChanges = { ...this.pendingChanges };
    cloned.undoStack = [...this.undoStack];
    cloned.redoStack = [...this.redoStack];
    return cloned;
  }

  public getPendingChanges(): ItemGroupPendingChanges {
    return { ...this.pendingChanges };
  }

  public applyChange(field: keyof ItemGroupRawFields, value: unknown): void {
    const originalValue = this.originalGroup.fields[field];
    if (JSON.stringify(originalValue) === JSON.stringify(value)) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public setField<K extends keyof ItemGroupRawFields>(field: K, value: ItemGroupRawFields[K] | undefined): void {
    const currentValue = Object.prototype.hasOwnProperty.call(this.pendingChanges, field)
      ? this.pendingChanges[field]
      : this.originalGroup.fields[field];

    if (JSON.stringify(currentValue) === JSON.stringify(value)) {
      return;
    }

    const command = new ItemGroupFieldEditCommand(field, currentValue, value);
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

  public getEffectiveFields(): ItemGroupRawFields {
    const fields: ItemGroupRawFields = { ...this.originalGroup.fields, ...this.pendingChanges };
    if (fields.SubGroups && fields.SubGroups.length > 0) {
      fields.List = getItemGroupAllEntries(fields);
    }
    return fields;
  }

  public getDiff(): Array<{ field: string; original: unknown; new: unknown }> {
    const diff: Array<{ field: string; original: unknown; new: unknown }> = [];
    for (const [key, newValue] of Object.entries(this.pendingChanges)) {
      diff.push({
        field: key,
        original: this.originalGroup.fields[key as keyof ItemGroupRawFields],
        new: newValue,
      });
    }
    return diff;
  }
}
