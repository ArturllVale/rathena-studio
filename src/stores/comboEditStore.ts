import { create } from 'zustand';
import { ComboEditSession } from '../domain/database/workspace/comboEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import { EffectiveItemCombo } from '../domain/database/combo/effectiveCombo';
import { ItemComboRawFields } from '../domain/database/combo/comboTypes';

interface ComboEditState {
  currentSession: ComboEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;

  startSession: (combo: EffectiveItemCombo) => void;
  cancelSession: () => void;
  reset: () => void;
  setField: <K extends keyof ItemComboRawFields>(field: K, value: ItemComboRawFields[K] | undefined) => void;
  undo: () => void;
  redo: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useComboEditStore = create<ComboEditState>((set, get) => ({
  currentSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startSession: (combo: EffectiveItemCombo) => {
    set({
      currentSession: new ComboEditSession(combo),
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
      currentSession: new ComboEditSession(currentSession.originalCombo),
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
