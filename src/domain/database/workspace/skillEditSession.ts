import { EffectiveSkill } from '../skill/effectiveSkill';
import { SkillRawFields } from '../skill/skillTypes';

export type SkillPendingChanges = Partial<SkillRawFields>;

export interface SkillEditCommand {
  field: keyof SkillRawFields;
  previousValue: unknown;
  nextValue: unknown;
  execute(session: SkillEditSession): void;
  undo(session: SkillEditSession): void;
}

export class SkillFieldEditCommand implements SkillEditCommand {
  constructor(
    public readonly field: keyof SkillRawFields,
    public readonly previousValue: unknown,
    public readonly nextValue: unknown
  ) {}

  public execute(session: SkillEditSession): void {
    session.applyChange(this.field, this.nextValue);
  }

  public undo(session: SkillEditSession): void {
    session.applyChange(this.field, this.previousValue);
  }
}

export class SkillEditSession {
  public readonly skillId: number;
  public readonly originalSkill: EffectiveSkill;
  private pendingChanges: SkillPendingChanges = {};

  private undoStack: SkillEditCommand[] = [];
  private redoStack: SkillEditCommand[] = [];

  constructor(skill: EffectiveSkill) {
    this.skillId = skill.id;
    this.originalSkill = skill;
  }

  public clone(): SkillEditSession {
    const cloned = new SkillEditSession(this.originalSkill);
    cloned.pendingChanges = { ...this.pendingChanges };
    cloned.undoStack = [...this.undoStack];
    cloned.redoStack = [...this.redoStack];
    return cloned;
  }

  public getPendingChanges(): SkillPendingChanges {
    return { ...this.pendingChanges };
  }

  public applyChange(field: keyof SkillRawFields, value: unknown): void {
    const originalValue = (this.originalSkill.fields as Record<string, unknown>)[field];
    if (originalValue === value) {
      delete this.pendingChanges[field];
    } else {
      (this.pendingChanges as Record<string, unknown>)[field] = value;
    }
  }

  public setField<K extends keyof SkillRawFields>(field: K, value: SkillRawFields[K] | undefined): void {
    const currentValue = Object.prototype.hasOwnProperty.call(this.pendingChanges, field)
      ? this.pendingChanges[field]
      : (this.originalSkill.fields as Record<string, unknown>)[field];

    if (currentValue === value) {
      return;
    }

    const command = new SkillFieldEditCommand(field, currentValue, value);
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
