import { create } from 'zustand';
import { DatabaseProviderId } from '../domain/database/provider/databaseProvider';

export type ProblemSeverity = 'error' | 'warning' | 'info';

export interface Problem {
  id: string;
  severity: ProblemSeverity;
  source: DatabaseProviderId | 'system';
  sourceId?: number | string;
  message: string;
}

interface ProblemsState {
  problems: Problem[];
  
  setProblems: (source: Problem['source'], problems: Problem[]) => void;
  clearProblems: (source?: Problem['source']) => void;
  addProblem: (problem: Omit<Problem, 'id'>) => void;
}

export const useProblemsStore = create<ProblemsState>((set) => ({
  problems: [],

  setProblems: (source, newProblems) => {
    set((state) => ({
      problems: [
        ...state.problems.filter(p => p.source !== source),
        ...newProblems
      ]
    }));
  },

  clearProblems: (source) => {
    set((state) => ({
      problems: source 
        ? state.problems.filter(p => p.source !== source)
        : []
    }));
  },

  addProblem: (problem) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      problems: [...state.problems, { ...problem, id }]
    }));
  }
}));
