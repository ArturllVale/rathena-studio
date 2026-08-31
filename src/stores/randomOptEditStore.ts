import { create } from 'zustand';
import {
  RandomOptionEditSession,
  RandomOptionGroupEditSession,
} from '../domain/database/workspace/randomOptEditSession';
import { ValidationIssue } from '../services/database/itemDatabaseValidator';
import {
  EffectiveRandomOption,
  EffectiveRandomOptionGroup,
} from '../domain/database/randomOpt/effectiveRandomOpt';
import {
  RandomOptionRawFields,
  RandomOptionGroupRawFields,
} from '../domain/database/randomOpt/randomOptTypes';

interface RandomOptEditState {
  currentOptionSession: RandomOptionEditSession | null;
  currentGroupSession: RandomOptionGroupEditSession | null;
  validationIssues: ValidationIssue[];
  commitError: string | null;
  isCommitting: boolean;

  startOptionSession: (opt: EffectiveRandomOption) => void;
  startGroupSession: (grp: EffectiveRandomOptionGroup) => void;
  cancelSession: () => void;
  setOptionField: <K extends keyof RandomOptionRawFields>(field: K, value: RandomOptionRawFields[K] | undefined) => void;
  setGroupField: <K extends keyof RandomOptionGroupRawFields>(field: K, value: RandomOptionGroupRawFields[K] | undefined) => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  setCommitError: (error: string | null) => void;
  setIsCommitting: (isCommitting: boolean) => void;
}

export const useRandomOptEditStore = create<RandomOptEditState>((set, get) => ({
  currentOptionSession: null,
  currentGroupSession: null,
  validationIssues: [],
  commitError: null,
  isCommitting: false,

  startOptionSession: (opt: EffectiveRandomOption) => {
    set({
      currentOptionSession: new RandomOptionEditSession(opt),
      currentGroupSession: null,
      validationIssues: [],
      commitError: null,
      isCommitting: false,
    });
  },

  startGroupSession: (grp: EffectiveRandomOptionGroup) => {
    set({
      currentGroupSession: new RandomOptionGroupEditSession(grp),
      currentOptionSession: null,
      validationIssues: [],
      commitError: null,
      isCommitting: false,
    });
  },

  cancelSession: () => {
    set({
      currentOptionSession: null,
      currentGroupSession: null,
      validationIssues: [],
      commitError: null,
      isCommitting: false,
    });
  },

  setOptionField: (field, value) => {
    const { currentOptionSession } = get();
    if (!currentOptionSession) return;

    const opt = currentOptionSession.originalOption;
    const newSession = new RandomOptionEditSession(opt);
    for (const [k, v] of Object.entries(currentOptionSession.getPendingChanges())) {
      newSession.setField(k as keyof RandomOptionRawFields, v as never);
    }
    newSession.setField(field, value);

    set({ currentOptionSession: newSession, commitError: null });
  },

  setGroupField: (field, value) => {
    const { currentGroupSession } = get();
    if (!currentGroupSession) return;

    const grp = currentGroupSession.originalGroup;
    const newSession = new RandomOptionGroupEditSession(grp);
    for (const [k, v] of Object.entries(currentGroupSession.getPendingChanges())) {
      newSession.setField(k as keyof RandomOptionGroupRawFields, v as never);
    }
    newSession.setField(field, value);

    set({ currentGroupSession: newSession, commitError: null });
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
