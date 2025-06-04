import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, onChange, theme = 'dark', 'data-testid': testId }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure the editor
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
      folding: true,
      renderLineHighlight: 'line',
      smoothScrolling: true,
    });

    // Define custom language for slide syntax
    monaco.languages.register({ id: 'slide-jsx' });
    
    monaco.languages.setMonarchTokensProvider('slide-jsx', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/function\s+\w+/, 'keyword'],
          [/return/, 'keyword'],
          [/className=/, 'attribute.name'],
          [/"[^"]*"/, 'string'],
          [/'[^']*'/, 'string'],
          [/<\/?[a-zA-Z][\w-]*/, 'tag'],
          [/\{|\}/, 'delimiter.curly'],
          [/\(|\)/, 'delimiter.parenthesis'],
          [/\[|\]/, 'delimiter.square'],
        ]
      }
    });

    // Set custom theme
    monaco.editor.defineTheme('slide-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'tag', foreground: '4FC1FF' },
        { token: 'attribute.name', foreground: '92C5F7' },
      ],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
      }
    });

    monaco.editor.setTheme('slide-dark');
  };

  return (
    <div data-testid={testId} className="h-full flex flex-col">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Slide Code Editor</h3>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language="javascript"
          value={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            padding: { top: 16, bottom: 16 },
            renderValidationDecorations: 'off',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
