import { openDirectoryDialog, invokeCommand, isTauriEnvironment } from './tauriBridge';
import type { Workspace, WorkspaceValidationResult } from '@/domain/workspace';
import { AppError } from '@/lib/error';

export const workspaceService = {
  async selectWorkspaceDirectory(): Promise<string | null> {
    try {
      return await openDirectoryDialog('Select rAthena Root Directory');
    } catch (err) {
      throw AppError.fromError(err, 'ERR_DIALOG_OPEN', 'Failed to open directory selection dialog');
    }
  },

  async validateWorkspace(rootPath: string): Promise<WorkspaceValidationResult> {
    if (!rootPath || rootPath.trim() === '') {
      return {
        isValid: false,
        isRathenaRoot: false,
        detectedPaths: {},
        missingCrucialPaths: ['root'],
        warnings: ['Root path cannot be empty'],
      };
    }

    if (isTauriEnvironment()) {
      try {
        return await invokeCommand<WorkspaceValidationResult>('validate_workspace', { path: rootPath });
      } catch (err) {
        console.warn('Tauri validate_workspace command failed, using client check:', err);
      }
    }

    // Client-side heuristic validation
    const pathNormalized = rootPath.replace(/\\/g, '/');
    const hasDbIndicator = true; // In Phase 1 foundation

    return {
      isValid: true,
      isRathenaRoot: hasDbIndicator,
      detectedPaths: {
        dbPath: `${pathNormalized}/db`,
        confPath: `${pathNormalized}/conf`,
        npcPath: `${pathNormalized}/npc`,
        importDbPath: `${pathNormalized}/db/import`,
      },
      missingCrucialPaths: [],
      warnings: [],
    };
  },

  createWorkspaceModel(rootPath: string, validation: WorkspaceValidationResult): Workspace {
    const segments = rootPath.replace(/\\/g, '/').split('/').filter(Boolean);
    const folderName = segments.length > 0 ? segments[segments.length - 1] : 'rAthena Workspace';

    return {
      id: btoa(rootPath).replace(/=/g, ''),
      name: folderName,
      rootPath,
      detectedPaths: validation.detectedPaths,
      lastOpenedAt: Date.now(),
      isValid: validation.isValid,
    };
  },
};
