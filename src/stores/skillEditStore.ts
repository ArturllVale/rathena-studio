import { create } from 'zustand';
import { SkillEditSession } from '../domain/database/workspace/skillEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import { EffectiveSkill } from '../domain/database/skill/effectiveSkill';
import { SkillRawFields } from '../domain/database/skill/skillTypes';

interface SkillEditState {
  currentSession: SkillEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;

  startSession: (skill: EffectiveSkill) => void;
  cancelSession: () => void;
  reset: () => void;
  setField: <K extends keyof SkillRawFields>(field: K, value: SkillRawFields[K] | undefined) => void;
  undo: () => void;
  redo: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useSkillEditStore = create<SkillEditState>((set, get) => ({
  currentSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startSession: (skill: EffectiveSkill) => {
    set({
      currentSession: new SkillEditSession(skill),
      validationIssues: [],
      commitError: null,
      isCommitting: false,
    });
  },

  cancelSession: () => {
    set({
      currentSession: null,
      validationIssues: [],
      commitError: null,
      isCommitting: false,
    });
  },

  reset: () => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      currentSession: new SkillEditSession(currentSession.originalSkill),
      validationIssues: [],
      commitError: null,
    });
  },

  setField: (field, value) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const newSession = currentSession.clone();
    newSession.setField(field, value);

    set({ currentSession: newSession, commitError: null });
  },

  undo: () => {
    const { currentSession } = get();
    if (!currentSession || !currentSession.canUndo) return;

    const newSession = currentSession.clone();
    newSession.undo();

    set({ currentSession: newSession, commitError: null });
  },

  redo: () => {
    const { currentSession } = get();
    if (!currentSession || !currentSession.canRedo) return;

    const newSession = currentSession.clone();
    newSession.redo();

    set({ currentSession: newSession, commitError: null });
  },

  setValidationIssues: (issues) => {
    set({ validationIssues: issues });
  },

  setCommitError: (error) => {
    set({ commitError: error });
  },

  setIsCommitting: (isCommitting) => {
    set({ isCommitting });
  },
}));
