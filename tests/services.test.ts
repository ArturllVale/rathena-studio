import { describe, it, expect } from 'vitest';
import { workspaceService } from '@/services/workspaceService';
import { settingsService } from '@/services/settingsService';
import { DEFAULT_APP_SETTINGS } from '@/domain/settings';

describe('WorkspaceService', () => {
  it('validates non-empty workspace paths heuristically', async () => {
    const result = await workspaceService.validateWorkspace('C:/rathena-server');
    expect(result.isValid).toBe(true);
    expect(result.detectedPaths.dbPath).toContain('db');
    expect(result.detectedPaths.confPath).toContain('conf');
  });

  it('rejects empty workspace path', async () => {
    const result = await workspaceService.validateWorkspace('');
    expect(result.isValid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('creates workspace model correctly', () => {
    const validation = {
      isValid: true,
      isRathenaRoot: true,
      detectedPaths: { dbPath: 'C:/games/rathena/db' },
      missingCrucialPaths: [],
      warnings: [],
    };
    const model = workspaceService.createWorkspaceModel('C:/games/rathena', validation);
    expect(model.name).toBe('rathena');
    expect(model.rootPath).toBe('C:/games/rathena');
    expect(model.isValid).toBe(true);
  });
});

describe('SettingsService', () => {
  it('returns default settings when storage is empty', () => {
    const settings = settingsService.getSettings();
    expect(settings.serverRuntime.mysqlPort).toBe(DEFAULT_APP_SETTINGS.serverRuntime.mysqlPort);
    expect(settings.ui.theme).toBe('dark');
  });

  it('persists and retrieves updated settings', () => {
    const custom = {
      ...DEFAULT_APP_SETTINGS,
      serverRuntime: {
        ...DEFAULT_APP_SETTINGS.serverRuntime,
        mysqlPort: 3307,
      },
    };
    settingsService.saveSettings(custom);
    const loaded = settingsService.getSettings();
    expect(loaded.serverRuntime.mysqlPort).toBe(3307);
  });
});
