import { create } from 'zustand';
import { ItemPackageEditSession } from '../domain/database/workspace/itemPackageEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import { EffectiveItemPackage } from '../domain/database/itemPackage/effectiveItemPackage';
import { ItemPackageRawFields } from '../domain/database/itemPackage/itemPackageTypes';

interface ItemPackageEditState {
  currentSession: ItemPackageEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;

  startSession: (pkg: EffectiveItemPackage) => void;
  cancelSession: () => void;
  reset: () => void;
  setField: <K extends keyof ItemPackageRawFields>(field: K, value: ItemPackageRawFields[K] | undefined) => void;
  undo: () => void;
  redo: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useItemPackageEditStore = create<ItemPackageEditState>((set, get) => ({
  currentSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startSession: (pkg: EffectiveItemPackage) => {
    set({
      currentSession: new ItemPackageEditSession(pkg),
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
      currentSession: new ItemPackageEditSession(currentSession.originalPackage),
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
