import { create } from 'zustand';
import type { AppSettings } from '@/domain/settings';
import { settingsService } from '@/services/settingsService';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleSidebar: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: settingsService.getSettings(),

  updateSettings: (updater) => {
    set((state) => {
      const next = updater(state.settings);
      settingsService.saveSettings(next);
      return { settings: next };
    });
  },

  setTheme: (theme) => {
    set((state) => {
      const next = {
        ...state.settings,
        ui: { ...state.settings.ui, theme },
      };
      settingsService.saveSettings(next);
      return { settings: next };
    });
  },

  toggleSidebar: () => {
    set((state) => {
      const next = {
        ...state.settings,
        ui: {
          ...state.settings.ui,
          sidebarCollapsed: !state.settings.ui.sidebarCollapsed,
        },
      };
      settingsService.saveSettings(next);
      return { settings: next };
    });
  },
}));
