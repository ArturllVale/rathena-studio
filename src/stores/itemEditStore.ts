import { create } from 'zustand';
import { ItemEditSession } from '../domain/database/workspace/itemEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import { EffectiveItem } from '../domain/database/item/effectiveItem';
import { ItemRawFields } from '../domain/database/item/itemTypes';

interface ItemEditState {
  currentSession: ItemEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;
  
  startSession: (item: EffectiveItem) => void;
  cancelSession: () => void;
  reset: () => void;
  setField: <K extends keyof ItemRawFields>(field: K, value: ItemRawFields[K] | undefined) => void;
  undo: () => void;
  redo: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useItemEditStore = create<ItemEditState>((set, get) => ({
  currentSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startSession: (item: EffectiveItem) => {
    set({
      currentSession: new ItemEditSession(item),
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
      currentSession: new ItemEditSession(currentSession.originalItem),
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
  }
}));
