import { create } from 'zustand';
import { parseDocument } from 'yaml';
import { TauriFileContentWriter } from '@/domain/database/workspace/fileContentWriter';
import { useDatabaseStore } from './databaseStore';
import { useAppStore } from './appStore';
import { YamlDocumentAdapter } from '@/services/database/yamlDocumentAdapter';

export interface YamlFileState {
  filePath: string;
  originalContent: string;
  currentContent: string;
  layerId?: string;
  isDirty: boolean;
  totalLines: number;
}

interface YamlEditorState {
  openFiles: string[];
  activeFilePath: string | null;
  files: Record<string, YamlFileState>;
  cursorTarget: { line: number; column?: number } | null;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;

  openFile: (filePath: string, content: string, layerId?: string) => void;
  closeFile: (filePath: string) => void;
  setActiveFile: (filePath: string) => void;
  updateFileContent: (filePath: string, content: string) => void;
  setCursorTarget: (target: { line: number; column?: number } | null) => void;
  discardChanges: (filePath: string) => void;
  saveFile: (filePath: string, rootPath: string) => Promise<boolean>;
  openFileAtEntity: (filePath: string, entityQuery: string | number, fallbackContent?: string, layerId?: string) => void;
}

export function findEntityLineInYaml(yamlText: string, query: string | number): number {
  if (!yamlText) return 1;
  const lines = yamlText.split('\n');
  const strQuery = String(query).trim();

  // 1. Exact match for Id: <id>
  const idRegex = new RegExp(`^\\s*Id:\\s*${strQuery}\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (idRegex.test(lines[i])) {
      return i + 1;
    }
  }

  // 2. Exact match for AegisName: <name> or Name: <name>
  const nameRegex = new RegExp(`^\\s*(AegisName|Name|Group|Package|Option):\\s*['"]?${strQuery}['"]?\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (nameRegex.test(lines[i])) {
      return i + 1;
    }
  }

  // 3. Fallback substring match
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(strQuery)) {
      return i + 1;
    }
  }

  return 1;
}

export const useYamlEditorStore = create<YamlEditorState>((set, get) => ({
  openFiles: [],
  activeFilePath: null,
  files: {},
  cursorTarget: null,
  isSaving: false,
  saveError: null,
  saveSuccess: false,

  openFile: (filePath, content, layerId) => {
    const totalLines = content.split('\n').length;
    set((state) => {
      const exists = state.files[filePath];
      const newFiles = {
        ...state.files,
        [filePath]: exists
          ? state.files[filePath]
          : {
              filePath,
              originalContent: content,
              currentContent: content,
              layerId,
              isDirty: false,
              totalLines,
            },
      };

      const newOpenFiles = state.openFiles.includes(filePath)
        ? state.openFiles
        : [...state.openFiles, filePath];

      return {
        files: newFiles,
        openFiles: newOpenFiles,
        activeFilePath: filePath,
        saveError: null,
      };
    });
  },

  closeFile: (filePath) => {
    set((state) => {
      const newOpenFiles = state.openFiles.filter((p) => p !== filePath);
      const newFiles = { ...state.files };
      delete newFiles[filePath];

      let nextActive = state.activeFilePath;
      if (state.activeFilePath === filePath) {
        nextActive = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null;
      }

      return {
        openFiles: newOpenFiles,
        files: newFiles,
        activeFilePath: nextActive,
      };
    });
  },

  setActiveFile: (filePath) => {
    set({ activeFilePath: filePath, saveError: null, saveSuccess: false });
  },

  updateFileContent: (filePath, content) => {
    set((state) => {
      const file = state.files[filePath];
      if (!file) return state;

      const isDirty = content !== file.originalContent;
      const totalLines = content.split('\n').length;

      return {
        files: {
          ...state.files,
          [filePath]: {
            ...file,
            currentContent: content,
            isDirty,
            totalLines,
          },
        },
      };
    });
  },

  setCursorTarget: (target) => {
    set({ cursorTarget: target });
  },

  discardChanges: (filePath) => {
    set((state) => {
      const file = state.files[filePath];
      if (!file) return state;

      return {
        files: {
          ...state.files,
          [filePath]: {
            ...file,
            currentContent: file.originalContent,
            isDirty: false,
            totalLines: file.originalContent.split('\n').length,
          },
        },
        saveError: null,
      };
    });
  },

  saveFile: async (filePath, rootPath) => {
    const file = get().files[filePath];
    if (!file) return false;

    set({ isSaving: true, saveError: null, saveSuccess: false });

    try {
      // 1. Validate YAML syntax
      const doc = parseDocument(file.currentContent, { prettyErrors: true });
      if (doc.errors && doc.errors.length > 0) {
        throw new Error(`YAML Syntax Error: ${doc.errors[0].message}`);
      }

      // 2. Write file to disk
      const writer = new TauriFileContentWriter(rootPath);
      await writer.writeFile(filePath, file.currentContent);

      // 3. Update database store adapter & layer cache if matching provider exists
      const dbStore = useDatabaseStore.getState();
      if (dbStore.registry) {
        for (const provider of dbStore.registry.getAllProviders()) {
          const repo = provider.getRepository() as { getRegisteredLayers?: () => Array<{ file: { path: string }; adapter: YamlDocumentAdapter; rawText: string }> } | undefined;
          if (repo && typeof repo.getRegisteredLayers === 'function') {
            const layers = repo.getRegisteredLayers();
            const matchedLayer = layers.find((l) => l.file.path === filePath || l.file.path.endsWith(filePath) || filePath.endsWith(l.file.path));
            if (matchedLayer) {
              matchedLayer.rawText = file.currentContent;
              matchedLayer.adapter = YamlDocumentAdapter.parse(file.currentContent);
              // Trigger reload for this database provider
              await dbStore.loadDatabase(provider.id, rootPath);
              break;
            }
          }
        }
      }

      set((state) => ({
        isSaving: false,
        saveSuccess: true,
        files: {
          ...state.files,
          [filePath]: {
            ...file,
            originalContent: file.currentContent,
            isDirty: false,
          },
        },
      }));

      return true;
    } catch (err) {
      set({
        isSaving: false,
        saveError: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  },

  openFileAtEntity: (filePath, entityQuery, fallbackContent = '', layerId) => {
    const state = get();
    let content = fallbackContent;

    if (state.files[filePath]) {
      content = state.files[filePath].currentContent;
    } else {
      get().openFile(filePath, content, layerId);
    }

    const targetLine = findEntityLineInYaml(content, entityQuery);
    set({
      activeFilePath: filePath,
      cursorTarget: { line: targetLine, column: 1 },
    });
  },
}));

export function openEntityInYamlEditor(filePath: string, entityQuery: string | number, layerId?: string): void {
  useYamlEditorStore.getState().openFileAtEntity(filePath, entityQuery, '', layerId);
  useAppStore.getState().setActiveTab('editor');
}

