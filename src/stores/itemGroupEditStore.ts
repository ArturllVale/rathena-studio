import { create } from 'zustand';
import { ItemGroupEditSession } from '../domain/database/workspace/itemGroupEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import { EffectiveItemGroup } from '../domain/database/itemGroup/effectiveItemGroup';
import { ItemGroupRawFields } from '../domain/database/itemGroup/itemGroupTypes';

interface ItemGroupEditState {
  currentSession: ItemGroupEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;

  startSession: (group: EffectiveItemGroup) => void;
  cancelSession: () => void;
  reset: () => void;
  setField: <K extends keyof ItemGroupRawFields>(field: K, value: ItemGroupRawFields[K] | undefined) => void;
  undo: () => void;
  redo: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useItemGroupEditStore = create<ItemGroupEditState>((set, get) => ({
  currentSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startSession: (group: EffectiveItemGroup) => {
    set({
      currentSession: new ItemGroupEditSession(group),
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
      currentSession: new ItemGroupEditSession(currentSession.originalGroup),
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
