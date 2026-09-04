import { useEffect, useRef, useMemo, useState } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';
import { useYamlEditorStore } from '@/stores/yamlEditorStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { YamlDocumentAdapter } from '@/services/database/yamlDocumentAdapter';
import {
  FileCode,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  Folder,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DiscoveredLayerFile {
  dbId: string;
  dbName: string;
  filePath: string;
  layerName: string;
  variant: string;
  rawText: string;
}

export function DatabaseYamlEditorView() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const registry = useDatabaseStore((s) => s.registry);

  const {
    openFiles,
    activeFilePath,
    files,
    cursorTarget,
    isSaving,
    saveError,
    saveSuccess,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    setCursorTarget,
    discardChanges,
    saveFile,
    resolveConflict,
    reloadFileFromDisk,
  } = useYamlEditorStore();

  const [jumpQuery, setJumpQuery] = useState('');
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);

  // Discover all registered YAML layers from active providers in DatabaseRegistry
  const layerFiles: DiscoveredLayerFile[] = useMemo(() => {
    if (!registry) return [];
    const result: DiscoveredLayerFile[] = [];

    for (const provider of registry.getAllProviders()) {
      const repo = provider.getRepository() as Record<string, unknown> | undefined;
      if (!repo) continue;

      const dbName =
        (provider as { displayName?: string; name?: string; id: string }).displayName ||
        (provider as { name?: string }).name ||
        provider.id;

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

      for (const l of layers) {
        const filePath = l.layer.relativePath || (l.file && (l.file as { filePath?: string }).filePath) || l.layer.id;
        const rawText = l.adapter ? l.adapter.toString() : '';

        // Avoid duplicate file entries
        if (!result.some((r) => r.filePath === filePath)) {
          result.push({
            dbId: provider.id,
            dbName,
            filePath,
            layerName: l.layer.name || l.layer.id,
            variant: l.layer.variant,
            rawText,
          });
        }
      }
    }

    return result;
  }, [registry]);

  // Group files by database name
  const groupedFiles = useMemo(() => {
    const groups: Record<string, DiscoveredLayerFile[]> = {};
    for (const f of layerFiles) {
      if (!groups[f.dbName]) {
        groups[f.dbName] = [];
      }
      groups[f.dbName].push(f);
    }
    return groups;
  }, [layerFiles]);

  // If no file is active but layer files exist, open the first one
  useEffect(() => {
    if (!activeFilePath && layerFiles.length > 0) {
      const first = layerFiles[0];
      openFile(first.filePath, first.rawText, first.layerName);
    }
  }, [activeFilePath, layerFiles, openFile]);

  const activeFileState = activeFilePath ? files[activeFilePath] : null;

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFilePath && activeWorkspace) {
        saveFile(activeFilePath, activeWorkspace.rootPath);
      }
    });

    const target = useYamlEditorStore.getState().cursorTarget;
    if (target) {
      setTimeout(() => {
        editor.revealLineInCenter(target.line);
        editor.setPosition({ lineNumber: target.line, column: target.column || 1 });
        editor.focus();
        setCursorTarget(null);
      }, 50);
    }
  };

  // Scroll to cursorTarget when updated
  useEffect(() => {
    if (cursorTarget && editorRef.current) {
      editorRef.current.revealLineInCenter(cursorTarget.line);
      editorRef.current.setPosition({ lineNumber: cursorTarget.line, column: cursorTarget.column || 1 });
      editorRef.current.focus();
      setCursorTarget(null);
    }
  }, [cursorTarget, setCursorTarget]);

  const handleJumpToEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumpQuery.trim() || !activeFileState || !editorRef.current) return;

    const content = activeFileState.currentContent;
    const lines = content.split('\n');
    const q = jumpQuery.trim();

    // Look for exact Id or AegisName or Name
    let matchedLine = -1;
    const idRegex = new RegExp(`^\\s*Id:\\s*${q}\\b`, 'i');
    const nameRegex = new RegExp(`^\\s*(AegisName|Name|Group|Package|Option):\\s*['"]?${q}['"]?\\b`, 'i');

    for (let i = 0; i < lines.length; i++) {
      if (idRegex.test(lines[i]) || nameRegex.test(lines[i])) {
        matchedLine = i + 1;
        break;
      }
    }

    if (matchedLine === -1) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(q.toLowerCase())) {
          matchedLine = i + 1;
          break;
        }
      }
    }

    if (matchedLine !== -1) {
      editorRef.current.revealLineInCenter(matchedLine);
      editorRef.current.setPosition({ lineNumber: matchedLine, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleSave = () => {
    if (!activeFilePath || !activeWorkspace) return;
    saveFile(activeFilePath, activeWorkspace.rootPath);
  };

  const theme = useSettingsStore((s) => s.settings.ui.theme);
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const monacoTheme = isDark ? 'vs-dark' : 'vs';

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden select-none">
      {/* Left Sidebar: File Tree Explorer */}
      <div className="w-72 bg-card border-r border-border/80 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-border/80 bg-secondary/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Database Files ({layerFiles.length})
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3 select-none">
          {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
            <div key={groupName} className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                {groupName}
              </div>
              <div className="space-y-0.5">
                {groupFiles.map((file) => {
                  const isOpen = openFiles.includes(file.filePath);
                  const isActive = activeFilePath === file.filePath;
                  const fileState = files[file.filePath];
                  const isDirty = fileState?.isDirty;

                  return (
                    <button
                      key={file.filePath}
                      type="button"
                      onClick={() => {
                        if (!isOpen) {
                          openFile(file.filePath, file.rawText, file.layerName);
                        } else {
                          setActiveFile(file.filePath);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <FileCode className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs font-mono">{file.filePath}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {isDirty && <span className="w-2 h-2 rounded-full bg-pastel-amber" title="Unsaved changes" />}
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono text-muted-foreground bg-secondary border border-border/60">
                          {file.variant}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {layerFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs px-4">
              Nenhum banco de dados carregado. Carregue os databases na aba principal para visualizar os arquivos YAML.
            </div>
          )}
        </div>
      </div>

      {/* Main Monaco Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Open Tabs Header */}
        <div className="flex items-center bg-secondary/35 border-b border-border/80 overflow-x-auto px-2 pt-1.5 gap-1.5">
          {openFiles.map((filePath) => {
            const isActive = activeFilePath === filePath;
            const fileState = files[filePath];
            const isDirty = fileState?.isDirty;
            const fileName = filePath.split('/').pop() || filePath;

            return (
              <div
                key={filePath}
                onClick={() => setActiveFile(filePath)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-mono cursor-pointer border-t border-x transition-all ${
                  isActive
                    ? 'bg-card text-foreground border-border/80 font-semibold shadow-2xs'
                    : 'bg-secondary/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/70'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[180px]">{fileName}</span>
                {isDirty && <span className="w-2 h-2 rounded-full bg-pastel-amber" />}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(filePath);
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground rounded hover:bg-accent/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        {activeFileState ? (
          <>
            <div className="p-3 bg-card border-b border-border/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-foreground font-medium text-xs truncate max-w-sm" title={activeFileState.filePath}>
                  {activeFileState.filePath}
                </span>
                {activeFileState.layerId && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-primary/10 text-primary border border-primary/25 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{activeFileState.layerId}</span>
                  </span>
                )}
                <span className="text-muted-foreground font-mono text-xs">
                  ({activeFileState.totalLines} lines)
                </span>
              </div>

              {/* Jump to Entity / Search in file */}
              <form onSubmit={handleJumpToEntity} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Jump to ID / AegisName..."
                    value={jumpQuery}
                    onChange={(e) => setJumpQuery(e.target.value)}
                    className="pl-8 h-8 w-56 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="p-2 bg-secondary hover:bg-secondary/80 border border-border/60 text-secondary-foreground rounded-lg text-xs transition-colors shadow-2xs"
                  title="Jump to Entity"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => reloadFileFromDisk(activeFileState.filePath)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-accent/60 transition-colors"
                  title="Reload from disk"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload</span>
                </button>
                
                {activeFileState.isDirty && (
                  <button
                    type="button"
                    onClick={() => discardChanges(activeFileState.filePath)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-accent/60 transition-colors"
                    title="Discard Unsaved Changes"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!activeFileState.isDirty || isSaving}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFileState.isDirty
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                  title="Save File (Ctrl+S)"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save (Ctrl+S)</span>
                </button>

                {saveSuccess && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {saveError && (
              <div className="bg-destructive/15 border-b border-destructive/30 px-4 py-2.5 text-xs text-destructive flex items-center gap-2 font-mono break-all font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            
            {/* Conflict Banner */}
            {activeFileState.hasConflict && (
              <div className="bg-pastel-amber/15 border-b border-pastel-amber/30 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between font-mono break-all font-medium">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>This file was modified externally. You have unsaved changes.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => resolveConflict(activeFileState.filePath, 'reload')}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                  >
                    Reload (Lose changes)
                  </button>
                  <button
                    onClick={() => resolveConflict(activeFileState.filePath, 'overwrite')}
                    className="px-3 py-1 rounded border border-amber-500/50 hover:bg-amber-500/10 transition-colors"
                  >
                    Keep my changes
                  </button>
                </div>
              </div>
            )}

            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language="yaml"
                theme={monacoTheme}
                value={activeFileState.currentContent}
                onChange={(val) => updateFileContent(activeFileState.filePath, val ?? '')}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  lineNumbersMinChars: 4,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  formatOnPaste: true,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-3">
            <FileCode className="w-14 h-14 text-muted-foreground/60" />
            <div className="text-sm font-medium">Selecione um arquivo na árvore à esquerda para editar.</div>
          </div>
        )}
      </div>
    </div>
  );
}
