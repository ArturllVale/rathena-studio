export interface DetectedPaths {
  dbPath?: string;
  confPath?: string;
  npcPath?: string;
  loginServerPath?: string;
  charServerPath?: string;
  mapServerPath?: string;
  importDbPath?: string;
}

export interface WorkspaceValidationResult {
  isValid: boolean;
  isRathenaRoot: boolean;
  detectedPaths: DetectedPaths;
  missingCrucialPaths: string[];
  warnings: string[];
}

export interface Workspace {
  id: string;
  name: string;
  rootPath: string;
  detectedPaths: DetectedPaths;
  lastOpenedAt: number;
  isValid: boolean;
}
