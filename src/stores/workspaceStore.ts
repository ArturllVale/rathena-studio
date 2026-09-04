import { create } from 'zustand';
import type { Workspace, WorkspaceValidationResult } from '@/domain/workspace';
import { workspaceService } from '@/services/workspaceService';
import { AppError } from '@/lib/error';
import { workspaceWatcher } from '@/services/workspace/workspaceWatcherService';
import { useYamlEditorStore } from './yamlEditorStore';

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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  // Set up the global file change listener once
  workspaceWatcher.onFileChange((filePath) => {
    // Notify yamlEditorStore about external modification
    // Note: useYamlEditorStore.getState() is safe here as this is outside the store creation cycle
    useYamlEditorStore.getState().handleExternalModification(filePath);
  });

  return {
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

        await workspaceWatcher.startWatching(path);

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
      workspaceWatcher.stopWatching();
      set({
        activeWorkspace: null,
        validationResult: null,
        error: null,
      });
    },

    clearError: () => {
      set({ error: null });
    },
  };
});
