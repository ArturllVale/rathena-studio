import { create } from 'zustand';
import { MobEditSession } from '../domain/database/workspace/mobEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import { EffectiveMob } from '../domain/database/mob/effectiveMob';
import { MobRawFields } from '../domain/database/mob/mobTypes';

interface MobEditState {
  currentSession: MobEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;

  startSession: (mob: EffectiveMob) => void;
  cancelSession: () => void;
  reset: () => void;
  setField: <K extends keyof MobRawFields>(field: K, value: MobRawFields[K] | undefined) => void;
  undo: () => void;
  redo: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useMobEditStore = create<MobEditState>((set, get) => ({
  currentSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startSession: (mob: EffectiveMob) => {
    set({
      currentSession: new MobEditSession(mob),
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
      currentSession: new MobEditSession(currentSession.originalMob),
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
