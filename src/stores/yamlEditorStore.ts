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
  if (!strQuery) return 1;

  // 1. Match for Id: <id> or - Id: <id>
  const idRegex = new RegExp(`^\\s*(-\\s*)?Id:\\s*${strQuery}\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (idRegex.test(lines[i])) {
      return i + 1;
    }
  }

  // 2. Match for AegisName / Name / Group / Package / Option
  const nameRegex = new RegExp(`^\\s*(-\\s*)?(AegisName|Name|Group|Package|Option):\\s*['"]?${strQuery}['"]?\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (nameRegex.test(lines[i])) {
      return i + 1;
    }
  }

  // 3. Match for combo item or list entry: - <item>
  const comboItemRegex = new RegExp(`^\\s*-\\s*['"]?${strQuery}['"]?\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (comboItemRegex.test(lines[i])) {
      return i + 1;
    }
  }

  // 4. Fallback substring match
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(strQuery.toLowerCase())) {
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
        [filePath]: exists && exists.currentContent.length > 0 && content.length === 0
          ? exists
          : {
              filePath,
              originalContent: content,
              currentContent: content,
              layerId: layerId || exists?.layerId,
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
          const repo = provider.getRepository() as Record<string, unknown> | undefined;
          if (!repo) continue;

          let layers: Array<{
            layer: { id: string; name: string; relativePath: string; variant: string };
            file?: { filePath?: string };
            adapter?: YamlDocumentAdapter;
          }> = [];

          if (typeof repo.getAllLayers === 'function') {
            layers = repo.getAllLayers() as typeof layers;
          } else {
            if (typeof repo.getAllOptionLayers === 'function') {
              layers.push(...(repo.getAllOptionLayers() as typeof layers));
            }
            if (typeof repo.getAllGroupLayers === 'function') {
              layers.push(...(repo.getAllGroupLayers() as typeof layers));
            }
          }

          const matchedLayer = layers.find((l) =>
            l.layer.relativePath === filePath ||
            l.layer.relativePath.endsWith(filePath) ||
            filePath.endsWith(l.layer.relativePath) ||
            l.layer.id === filePath ||
            (l.file && (l.file as { filePath?: string }).filePath === filePath)
          );

          if (matchedLayer) {
            matchedLayer.adapter = YamlDocumentAdapter.parse(file.currentContent);
            if (typeof repo.invalidate === 'function') {
              repo.invalidate();
            }
            // Trigger reload for this database provider
            await dbStore.loadDatabase(provider.id, rootPath);
            break;
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

    if (state.files[filePath] && state.files[filePath].currentContent.length > 0) {
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
  const store = useYamlEditorStore.getState();
  const dbStore = useDatabaseStore.getState();

  let content = '';
  let targetPath = filePath;
  let targetLayerId = layerId;

  // 1. If already open and has content in store, use it
  if (store.files[filePath] && store.files[filePath].currentContent.length > 0) {
    content = store.files[filePath].currentContent;
    targetPath = filePath;
  } else if (dbStore.registry) {
    // 2. Discover layer content from DatabaseRegistry repositories
    for (const provider of dbStore.registry.getAllProviders()) {
      const repo = provider.getRepository() as Record<string, unknown> | undefined;
      if (!repo) continue;

      let layers: Array<{
        layer: { id: string; name: string; relativePath: string; variant: string };
        file?: { filePath?: string };
        adapter?: YamlDocumentAdapter;
      }> = [];

      if (typeof repo.getAllLayers === 'function') {
        layers = repo.getAllLayers() as typeof layers;
      } else {
        if (typeof repo.getAllOptionLayers === 'function') {
          layers.push(...(repo.getAllOptionLayers() as typeof layers));
        }
        if (typeof repo.getAllGroupLayers === 'function') {
          layers.push(...(repo.getAllGroupLayers() as typeof layers));
        }
      }

      const matched = layers.find((l) => {
        if (layerId && (l.layer.id === layerId || l.layer.name === layerId)) return true;
        if (l.layer.relativePath === filePath) return true;
        if (filePath.endsWith(l.layer.relativePath) || l.layer.relativePath.endsWith(filePath)) return true;
        if (l.file && (l.file as { filePath?: string }).filePath === filePath) return true;
        return false;
      });

      if (matched && matched.adapter) {
        content = matched.adapter.toString();
        targetPath = matched.layer.relativePath || (matched.file && (matched.file as { filePath?: string }).filePath) || filePath;
        targetLayerId = matched.layer.id;
        break;
      }
    }
  }

  store.openFileAtEntity(targetPath, entityQuery, content, targetLayerId);
  useAppStore.getState().setActiveTab('editor');
}

