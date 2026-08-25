export interface ServerRuntimeSettings {
  autoRestart: boolean;
  loginServerExecutable?: string;
  charServerExecutable?: string;
  mapServerExecutable?: string;
  mysqlHost?: string;
  mysqlPort?: number;
  mysqlDatabase?: string;
  mysqlUser?: string;
}

export interface UISettings {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  sidebarCollapsed: boolean;
  compactMode: boolean;
}

export interface AppSettings {
  recentWorkspaces: string[];
  activeWorkspacePath?: string;
  serverRuntime: ServerRuntimeSettings;
  ui: UISettings;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  recentWorkspaces: [],
  serverRuntime: {
    autoRestart: false,
    mysqlHost: '127.0.0.1',
    mysqlPort: 3306,
    mysqlDatabase: 'ragnarok',
    mysqlUser: 'ragnarok',
  },
  ui: {
    theme: 'dark',
    fontSize: 14,
    sidebarCollapsed: false,
    compactMode: false,
  },
};
