"use client";

import type * as monaco from "monaco-editor"; // to replace 'any' types in editorRef & onMount init

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";

function CodeEditor() {
  /*
    Still getting used to TS but excluding "| null" works.
    Copilot suggested adding it for extra type safety since editorRef is null before mounting.
  */
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [_code, setCode] = useState<string>("");
  const { theme } = useTheme();

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <Editor
      // No need for mini map in a small editor like ours; just clutter
      options={{
        minimap: {
          enabled: false,
        },
      }}

      // Need to mount for autofocus & I think for some extra features in future
      onMount={onMount}

      // Temporarily hardcoded values for now
      height="30vh"
      defaultLanguage="javascript"
      defaultValue="// Write your code here"
      theme={theme === "dark" ? "vs-dark" : "vs-light"}

      // State management
      onChange={value => setCode(value || "")}
    />
  );
}

export default CodeEditor;
