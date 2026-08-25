import { create } from 'zustand';

export type ActiveNavTab = 'workspace' | 'databases' | 'processes' | 'logs' | 'settings';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface AppState {
  activeTab: ActiveNavTab;
  notifications: AppNotification[];
  isTauri: boolean;

  setActiveTab: (tab: ActiveNavTab) => void;
  addNotification: (type: AppNotification['type'], message: string) => void;
  dismissNotification: (id: string) => void;
  setIsTauri: (isTauri: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'workspace',
  notifications: [],
  isTauri: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  addNotification: (type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { id, type, message, timestamp: Date.now() }],
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  setIsTauri: (isTauri) => set({ isTauri }),
}));
