import { useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';
import { registerRathenaScriptLanguage, RATHENA_SCRIPT_LANGUAGE_ID } from './rathenaScriptLanguage';
import { RathenaScriptValidator } from '@/services/script/rathenaScriptValidator';

interface MonacoScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  readOnly?: boolean;
  placeholder?: string;
  validateScript?: boolean;
}

export function MonacoScriptEditor({
  value,
  onChange,
  height = 180,
  readOnly = false,
  validateScript = true,
}: MonacoScriptEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    registerRathenaScriptLanguage(monaco);

    // Initial validation markers
    if (validateScript) {
      updateMarkers(editor.getValue(), monaco, editor.getModel());
    }
  };

  const updateMarkers = (code: string, monaco: Monaco, model: monacoType.editor.ITextModel | null) => {
    if (!model) return;
    const issues = RathenaScriptValidator.validate(code);
    const markers: monacoType.editor.IMarkerData[] = issues.map((issue) => ({
      startLineNumber: issue.line,
      startColumn: 1,
      endLineNumber: issue.line,
      endColumn: 100,
      message: issue.message,
      severity: issue.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    }));

    monaco.editor.setModelMarkers(model, 'rathena-script-validator', markers);
  };

  useEffect(() => {
    if (validateScript && monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      updateMarkers(value, monacoRef.current, model);
    }
  }, [value, validateScript]);

  return (
    <div className="w-full rounded border border-[#27272a] bg-[#141416] overflow-hidden">
      <Editor
        height={height}
        language={RATHENA_SCRIPT_LANGUAGE_ID}
        theme="vs-dark"
        value={value}
        onChange={(val) => {
          const next = val ?? '';
          onChange(next);
          if (validateScript && monacoRef.current && editorRef.current) {
            updateMarkers(next, monacoRef.current, editorRef.current.getModel());
          }
        }}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
          tabSize: 2,
          insertSpaces: true,
          readOnly,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          suggest: {
            showKeywords: true,
            showSnippets: true,
            preview: true,
          },
        }}
      />
    </div>
  );
}
