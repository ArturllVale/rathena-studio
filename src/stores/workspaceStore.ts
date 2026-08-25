import { create } from 'zustand';
import type { Workspace, WorkspaceValidationResult } from '@/domain/workspace';
import { workspaceService } from '@/services/workspaceService';
import { AppError } from '@/lib/error';

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  error: AppError | null;
  validationResult: WorkspaceValidationResult | null;
  
  // Actions
  openWorkspaceDirectory: () => Promise<void>;
  setWorkspaceFromPath: (path: string) => Promise<void>;
  closeWorkspace: () => void;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeWorkspace: null,
  isLoading: false,
  error: null,
  validationResult: null,

  openWorkspaceDirectory: async () => {
    set({ isLoading: true, error: null });
    try {
      const selectedPath = await workspaceService.selectWorkspaceDirectory();
      if (!selectedPath) {
        set({ isLoading: false });
        return;
      }
      await get().setWorkspaceFromPath(selectedPath);
    } catch (err) {
      set({
        error: AppError.fromError(err, 'ERR_WORKSPACE_OPEN', 'Failed to open workspace directory'),
        isLoading: false,
      });
    }
  },

  setWorkspaceFromPath: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const validation = await workspaceService.validateWorkspace(path);
      const workspace = workspaceService.createWorkspaceModel(path, validation);

      set({
        activeWorkspace: workspace,
        validationResult: validation,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        error: AppError.fromError(err, 'ERR_WORKSPACE_VALIDATE', 'Failed to validate workspace structure'),
        isLoading: false,
      });
    }
  },

  closeWorkspace: () => {
    set({
      activeWorkspace: null,
      validationResult: null,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
