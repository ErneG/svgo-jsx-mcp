"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { OnChange, OnMount } from "@monaco-editor/react";

// Dynamic import to avoid SSR issues with Monaco
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[rgb(var(--card))]">
      <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--muted-foreground))]" />
    </div>
  ),
});

export interface SvgCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: "xml" | "javascript" | "typescript" | "html";
  className?: string;
}

export function SvgCodeEditor({
  value,
  onChange,
  readOnly = false,
  language = "xml",
  className = "",
}: SvgCodeEditorProps) {
  const handleChange: OnChange = (newValue) => {
    if (onChange && newValue !== undefined) {
      onChange(newValue);
    }
  };

  const handleMount: OnMount = (editor, monaco) => {
    // Register custom SVG theme colors
    monaco.editor.defineTheme("svg-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "tag", foreground: "569CD6" },
        { token: "attribute.name", foreground: "9CDCFE" },
        { token: "attribute.value", foreground: "CE9178" },
        { token: "string", foreground: "CE9178" },
        { token: "comment", foreground: "6A9955" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#1a1a1a",
        "editorCursor.foreground": "#a78bfa",
        "editor.selectionBackground": "#264f78",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
      },
    });

    monaco.editor.setTheme("svg-dark");

    // Focus editor if not read-only
    if (!readOnly) {
      editor.focus();
    }
  };

  return (
    <div className={`h-full w-full overflow-hidden rounded-lg ${className}`}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        theme="svg-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          wrappingStrategy: "advanced",
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          folding: true,
          foldingHighlight: true,
          bracketPairColorization: { enabled: true },
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
        }}
      />
    </div>
  );
}
