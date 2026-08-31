import { useEffect, useRef, useMemo, useState } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';
import { useYamlEditorStore } from '@/stores/yamlEditorStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
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
  const metadataMap = useDatabaseStore((s) => s.metadataMap);

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
  }, [registry, metadataMap]);

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

  return (
    <div className="flex h-full w-full bg-[#141416] text-neutral-100 overflow-hidden select-none">
      {/* Left Sidebar: File Tree Explorer */}
      <div className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#27272a] bg-[#1f1f23] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Database Files ({layerFiles.length})
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3 select-none">
          {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
            <div key={groupName} className="space-y-1">
              <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-2 py-0.5">
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
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left transition-colors ${
                        isActive
                          ? 'bg-sky-600/20 text-sky-300 font-medium border border-sky-500/30'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f23]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <FileCode className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                        <span className="truncate text-[11px] font-mono">{file.filePath}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
                        <span className="text-[9px] px-1 py-0.2 rounded font-mono text-neutral-500 bg-[#141416] border border-[#27272a]">
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
            <div className="text-center py-8 text-neutral-500 text-xs px-4">
              Nenhum banco de dados carregado. Carregue os databases na aba principal para visualizar os arquivos YAML.
            </div>
          )}
        </div>
      </div>

      {/* Main Monaco Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#141416]">
        {/* Open Tabs Header */}
        <div className="flex items-center bg-[#1f1f23] border-b border-[#27272a] overflow-x-auto px-2 pt-1 gap-1">
          {openFiles.map((filePath) => {
            const isActive = activeFilePath === filePath;
            const fileState = files[filePath];
            const isDirty = fileState?.isDirty;
            const fileName = filePath.split('/').pop() || filePath;

            return (
              <div
                key={filePath}
                onClick={() => setActiveFile(filePath)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-mono cursor-pointer border-t border-x transition-colors ${
                  isActive
                    ? 'bg-[#141416] text-sky-300 border-[#27272a] font-medium'
                    : 'bg-[#18181b] text-neutral-400 border-transparent hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[160px]">{fileName}</span>
                {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(filePath);
                  }}
                  className="p-0.5 text-neutral-500 hover:text-neutral-200 rounded hover:bg-[#27272a]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        {activeFileState ? (
          <>
            <div className="p-2.5 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-neutral-200 text-xs truncate max-w-sm" title={activeFileState.filePath}>
                  {activeFileState.filePath}
                </span>
                {activeFileState.layerId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-sky-950/40 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{activeFileState.layerId}</span>
                  </span>
                )}
                <span className="text-neutral-500 font-mono text-[11px]">
                  ({activeFileState.totalLines} lines)
                </span>
              </div>

              {/* Jump to Entity / Search in file */}
              <form onSubmit={handleJumpToEntity} className="flex items-center gap-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-neutral-500" />
                  <Input
                    type="text"
                    placeholder="Jump to ID / AegisName..."
                    value={jumpQuery}
                    onChange={(e) => setJumpQuery(e.target.value)}
                    className="pl-7 h-7 w-48 bg-[#141416] border-[#27272a] text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="p-1.5 bg-[#1f1f23] hover:bg-[#27272a] border border-[#27272a] text-neutral-300 rounded text-xs"
                  title="Jump to Entity"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {activeFileState.isDirty && (
                  <button
                    type="button"
                    onClick={() => discardChanges(activeFileState.filePath)}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded hover:bg-[#1f1f23]"
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
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeFileState.isDirty
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                      : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
                  }`}
                  title="Save File (Ctrl+S)"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save (Ctrl+S)</span>
                </button>

                {saveSuccess && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {saveError && (
              <div className="bg-red-950/40 border-b border-red-500/30 px-3 py-2 text-xs text-red-300 flex items-center gap-2 font-mono break-all">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language="yaml"
                theme="vs-dark"
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
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-2">
            <FileCode className="w-12 h-12 text-neutral-600" />
            <div className="text-sm">Selecione um arquivo na árvore à esquerda para editar.</div>
          </div>
        )}
      </div>
    </div>
  );
}
