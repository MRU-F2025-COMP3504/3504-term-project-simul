"use client";

import type * as monaco from "monaco-editor";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import type { KeystrokeEvent } from "~/types/playback";

import { Button } from "~/components/ui/button";

export default function CodeRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [initialCode, setInitialCode] = useState("// Start here\n");
  const [recordedEvents, setRecordedEvents] = useState<KeystrokeEvent[]>([]);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const startTimeRef = useRef<number>(0);
  const { theme } = useTheme();

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!editorRef.current)
      return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model)
      return;

    if (!isRecording)
      return;

    const disposable = model.onDidChangeContent((e) => {
      const currentTime = Date.now() - startTimeRef.current;

      for (const change of e.changes) {
        const position = model.getPositionAt(change.rangeOffset);

        if (change.text) {
          // insertion
          const event: KeystrokeEvent = {
            timestamp: currentTime,
            type: "insert",
            position: { line: position.lineNumber, column: position.column },
            content: change.text,
          };
          setRecordedEvents(prev => [...prev, event]);
        }
        else if (change.rangeLength > 0) {
          // deletion
          const event: KeystrokeEvent = {
            timestamp: currentTime,
            type: "delete",
            position: { line: position.lineNumber, column: position.column },
            length: change.rangeLength,
          };
          setRecordedEvents(prev => [...prev, event]);
        }
      }
    });

    return () => {
      disposable.dispose();
    };
  }, [isRecording]);

  const startRecording = () => {
    const currentCode = editorRef.current?.getValue() || "";
    setInitialCode(currentCode);
    setRecordedEvents([]);
    startTimeRef.current = Date.now();
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const outputJSON = {
    id: "example",
    videoUrl: "https://example.com/video.mp4",
    initialCode,
    keystrokeEvents: recordedEvents,
    pausePoints: [],
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(outputJSON, null, 2));
    }
    catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center gap-4">
          <Button onClick={startRecording} disabled={isRecording}>
            {isRecording ? "Recording..." : "Start Recording"}
          </Button>
          <Button onClick={stopRecording} variant="outline" disabled={!isRecording}>
            Stop Recording
          </Button>
          {isRecording && (
            <div className="text-muted-foreground text-sm">
              Time:
              {" "}
              {((Date.now() - startTimeRef.current) / 1000).toFixed(1)}
              s
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 p-4">
        <div className="flex-1 rounded-lg border">
          <div className="bg-muted/50 border-b px-4 py-2 text-sm font-medium">
            Code Editor
          </div>
          <Editor
            options={{
              minimap: {
                enabled: false,
              },
              readOnly: false,
              scrollBeyondLastLine: false,
            }}
            onMount={onMount}
            height="calc(100vh - 200px)"
            defaultLanguage="javascript"
            defaultValue={initialCode}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
          />
        </div>

        <div className="flex-1 rounded-lg border">
          <div
            className={`
              bg-muted/50 flex items-center justify-between border-b px-4 py-2
            `}
          >
            <span className="text-sm font-medium">Recorded Events (JSON)</span>
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              Copy JSON
            </Button>
          </div>
          <div className="h-[calc(100vh-200px)] overflow-auto p-4">
            <pre className="text-xs">
              {JSON.stringify(outputJSON, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
