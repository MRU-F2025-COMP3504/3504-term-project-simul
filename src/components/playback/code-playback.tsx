"use client";

import type * as monaco from "monaco-editor";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useMemo, useRef } from "react";

import type { KeystrokeEvent, Section } from "~/types/playback";

type CodePlaybackProps = {
  section: Section;
  videoTimeInMS: number;
};

function applyKeystrokeEvent(code: string, event: KeystrokeEvent): string {
  const lines = code.split("\n");

  const lineIndex = event.position.line - 1; // monaco uses 1-based line / col numbers
  const columnIndex = event.position.column - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    console.warn("Invalid line position:", event.position);
    return code;
  }

  const currentLine = lines[lineIndex] || "";

  switch (event.type) {
    case "insert": {
      if (event.content === undefined) {
        return code;
      }

      // handle multi-line insertions (e.g., pasting code)
      if (event.content.includes("\n")) {
        const contentLines = event.content.split("\n");
        const beforeInsert = currentLine.substring(0, columnIndex);
        const afterInsert = currentLine.substring(columnIndex);

        lines[lineIndex] = beforeInsert + contentLines[0];

        for (let i = 1; i < contentLines.length; i++) {
          lines.splice(lineIndex + i, 0, contentLines[i]);
        }

        const lastLineIndex = lineIndex + contentLines.length - 1;
        lines[lastLineIndex] += afterInsert;
      }
      else {
        // single-line insertion
        lines[lineIndex] = currentLine.substring(0, columnIndex)
          + event.content
          + currentLine.substring(columnIndex);
      }
      break;
    }

    case "delete": {
      const length = event.length || 1;

      // handle deletion by removing characters starting from position
      // simple approach: work with the lines array and delete character by character
      let charsToDelete = length;

      while (charsToDelete > 0 && lineIndex < lines.length) {
        const line = lines[lineIndex] || "";
        const availableChars = line.length - columnIndex;

        if (availableChars >= charsToDelete) {
          lines[lineIndex] = line.substring(0, columnIndex)
            + line.substring(columnIndex + charsToDelete);
          charsToDelete = 0;
        }
        else {
          // delete to end of line and merge with next
          charsToDelete -= availableChars + 1;

          if (lineIndex + 1 < lines.length) {
            lines[lineIndex] = line.substring(0, columnIndex) + (lines[lineIndex + 1] || "");
            lines.splice(lineIndex + 1, 1);
          }
          else {
            lines[lineIndex] = line.substring(0, columnIndex);
            charsToDelete = 0;
          }
        }
      }
      break;
    }

    case "select": {
      // TODO: implement visual selection
      break;
    }

    default:
      console.warn("Unknown event type:", event);
  }

  return lines.join("\n");
}

export default function CodePlayback({ section, videoTimeInMS }: CodePlaybackProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();

  const editorContent = useMemo(() => {
    const applicableEvents = section.keystrokeEvents.filter(
      event => event.timestamp <= videoTimeInMS,
    );

    let code = section.initialCode;

    for (const event of applicableEvents) {
      code = applyKeystrokeEvent(code, event);
    }

    return code;
  }, [videoTimeInMS, section]);

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  return (
    <Editor
      options={{
        minimap: {
          enabled: false,
        },
        readOnly: true, // no editing during playback
        scrollBeyondLastLine: false,
      }}
      onMount={onMount}
      height="100%"
      defaultLanguage="javascript"
      value={editorContent}
      theme={theme === "dark" ? "vs-dark" : "vs-light"}
    />
  );
}
