import { EffectiveMob } from '../mob/effectiveMob';
import { MobRawFields } from '../mob/mobTypes';

export type MobPendingChanges = Partial<MobRawFields>;

export interface MobEditCommand {
  field: keyof MobRawFields;
  previousValue: unknown;
  nextValue: unknown;
  execute(session: MobEditSession): void;
  undo(session: MobEditSession): void;
}

export class MobFieldEditCommand implements MobEditCommand {
  constructor(
    public readonly field: keyof MobRawFields,
    public readonly previousValue: unknown,
    public readonly nextValue: unknown
  ) {}

  public execute(session: MobEditSession): void {
    session.applyChange(this.field, this.nextValue);
  }

  public undo(session: MobEditSession): void {
    session.applyChange(this.field, this.previousValue);
  }
}

export class MobEditSession {
  public readonly mobId: number;
  public readonly originalMob: EffectiveMob;
  private pendingChanges: MobPendingChanges = {};

  private undoStack: MobEditCommand[] = [];
  private redoStack: MobEditCommand[] = [];

  constructor(mob: EffectiveMob) {
    this.mobId = mob.id;
    this.originalMob = mob;
  }

  public clone(): MobEditSession {
    const cloned = new MobEditSession(this.originalMob);
    cloned.pendingChanges = { ...this.pendingChanges };
    cloned.undoStack = [...this.undoStack];
    cloned.redoStack = [...this.redoStack];
    return cloned;
  }

  public getPendingChanges(): MobPendingChanges {
    return { ...this.pendingChanges };
  }

  public applyChange(field: keyof MobRawFields, value: unknown): void {
    const originalValue = this.originalMob.fields[field];
    if (originalValue === value) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public setField<K extends keyof MobRawFields>(field: K, value: MobRawFields[K] | undefined): void {
    const currentValue = Object.prototype.hasOwnProperty.call(this.pendingChanges, field)
      ? this.pendingChanges[field]
      : this.originalMob.fields[field];

    if (currentValue === value) {
      return;
    }

    const command = new MobFieldEditCommand(field, currentValue, value);
    this.undoStack.push(command);
    this.redoStack = [];

    command.execute(this);
  }

  public undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;

    command.undo(this);
    this.redoStack.push(command);
    return true;
  }

  public redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;

    command.execute(this);
    this.undoStack.push(command);
    return true;
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

  public reset(): void {
    this.pendingChanges = {};
    this.undoStack = [];
    this.redoStack = [];
  }
}
