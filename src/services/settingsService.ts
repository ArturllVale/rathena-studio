import { AppSettings, DEFAULT_APP_SETTINGS } from '@/domain/settings';

const SETTINGS_STORAGE_KEY = 'rathena_studio_settings_v1';

export const settingsService = {
  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_APP_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsed,
        serverRuntime: {
          ...DEFAULT_APP_SETTINGS.serverRuntime,
          ...(parsed.serverRuntime || {}),
        },
        ui: {
          ...DEFAULT_APP_SETTINGS.ui,
          ...(parsed.ui || {}),
        },
      };
    } catch (err) {
      console.error('Failed to load settings from storage:', err);
      return DEFAULT_APP_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to persist settings:', err);
    }
  },
};
