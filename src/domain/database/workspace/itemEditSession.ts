import { EffectiveItem } from '../item/effectiveItem';
import { ItemRawFields } from '../item/itemTypes';

export type PendingChanges = Partial<ItemRawFields>;

export interface EditCommand {
  field: keyof ItemRawFields;
  previousValue: unknown;
  nextValue: unknown;
  execute(session: ItemEditSession): void;
  undo(session: ItemEditSession): void;
}

export class FieldEditCommand implements EditCommand {
  constructor(
    public readonly field: keyof ItemRawFields,
    public readonly previousValue: unknown,
    public readonly nextValue: unknown
  ) {}

  public execute(session: ItemEditSession): void {
    session.applyChange(this.field, this.nextValue);
  }

  public undo(session: ItemEditSession): void {
    session.applyChange(this.field, this.previousValue);
  }
}

export class ItemEditSession {
  public readonly itemId: number;
  public readonly originalItem: EffectiveItem;
  private pendingChanges: PendingChanges = {};
  
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];

  constructor(item: EffectiveItem) {
    this.itemId = item.id;
    this.originalItem = item;
  }
  
  public clone(): ItemEditSession {
    const cloned = new ItemEditSession(this.originalItem);
    cloned.pendingChanges = { ...this.pendingChanges };
    cloned.undoStack = [...this.undoStack];
    cloned.redoStack = [...this.redoStack];
    return cloned;
  }
  
  public getPendingChanges(): PendingChanges {
    return { ...this.pendingChanges };
  }
  
  public applyChange(field: keyof ItemRawFields, value: unknown): void {
    const originalValue = this.originalItem.fields[field];
    if (originalValue === value) {
      delete this.pendingChanges[field];
    } else {
      this.pendingChanges[field] = value as any;
    }
  }

  public setField<K extends keyof ItemRawFields>(field: K, value: ItemRawFields[K] | undefined): void {
    const currentValue = Object.prototype.hasOwnProperty.call(this.pendingChanges, field)
      ? this.pendingChanges[field] 
      : this.originalItem.fields[field];

    if (currentValue === value) {
      return;
    }

    const command = new FieldEditCommand(field, currentValue, value);
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

  public get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public get isDirty(): boolean {
    return Object.keys(this.pendingChanges).length > 0;
  }
  
  public getEffectiveFields(): ItemRawFields {
    return { ...this.originalItem.fields, ...this.pendingChanges };
  }

  public getDiff(): Array<{ field: string, original: unknown, new: unknown }> {
    const diff: Array<{ field: string, original: unknown, new: unknown }> = [];
    for (const [key, newValue] of Object.entries(this.pendingChanges)) {
      diff.push({
        field: key,
        original: this.originalItem.fields[key as keyof ItemRawFields],
        new: newValue,
      });
    }
    return diff;
  }
}
