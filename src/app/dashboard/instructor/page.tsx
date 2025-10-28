"use client";

import type { EditorState as CMEditorState } from "@codemirror/state";

import { useMemo, useRef, useState } from "react";

import type { RecordedEvent, TestDetail, TestResults } from "~/types/coding-session";

import { CodeMirrorEditor, CursorOverlay, FileTabs } from "~/components/coding-session/editor";
import { FileSidebar } from "~/components/coding-session/file-sidebar";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { useFilesManager, useRecorder } from "~/hooks/coding-session";
import { TWO_SUM_STARTER_CODE, TWO_SUM_TEST_CASES } from "~/lib/coding-session/tests/two-sum";
import { formatDisplayTime } from "~/lib/coding-session/time";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const starterCode = TWO_SUM_STARTER_CODE;
  const TEST_CASES = TWO_SUM_TEST_CASES;

  // Initialize hooks
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(false);
  const editorApiRef = useRef<{
    setDoc: (content: string) => void;
    setSelection: (selection: { anchor: number; head: number }) => void;
    getState: () => { doc: { toString: () => string } } | null;
  } | null>(null);

  const filesManager = useFilesManager(starterCode, editorApiRef);
  const recorder = useRecorder(
    event => setRecordedEvents(prev => [...prev, event]),
    () => filesManager.activeFile,
    editor,
  );

  // Keep for playback control
  const initialStateRef = useRef<CMEditorState | null>(null);

  // Wrapper to handle recording state transitions
  const handleToggleRecording = () => {
    if (!recorder.recording) {
      // Starting recording - capture initial state and reset events
      initialStateRef.current = (editorApiRef.current?.getState() as any) ?? null;
      setRecordedEvents([]);
      setPlaybackTime(0);
      recorder.startRecording();
    }
    else {
      // Stopping recording - save current editor state to files
      if (editorApiRef.current) {
        const state = editorApiRef.current.getState();
        if (state) {
          const currentContent = (state as any).doc.toString();
          filesManager.updateFileContent(filesManager.activeFile, currentContent);
        }
      }
      recorder.stopRecording();
    }
  };

  const handlePlayback: () => Promise<void> = async () => {
    if (!editorApiRef.current)
      return;
    if (!recordedEvents || recordedEvents.length === 0)
      return;

    // Reset editor to initial state
    if (initialStateRef.current) {
      const initialContent = initialStateRef.current.doc.toString();
      editorApiRef.current.setDoc(initialContent);
    }

    // Show cursor overlay
    if (cursorRef.current) {
      cursorRef.current.style.display = "block";
    }

    const playbackStartTime = Date.now();
    const recordingStartTime = recordedEvents[0]?.time ?? 0;

    // Start a timer to continuously update playback time
    const timerInterval = setInterval(() => {
      if (!playingRef.current) {
        clearInterval(timerInterval);
        return;
      }
      const elapsedTime = Date.now() - playbackStartTime;
      const newPlaybackTime = recordingStartTime + elapsedTime;
      setPlaybackTime(newPlaybackTime);
    }, 50); // Update every 50ms for smooth progress

    let eventIndex = 0;

    while (eventIndex < recordedEvents.length && playingRef.current) {
      const event = recordedEvents[eventIndex];
      const nextEvent = eventIndex < recordedEvents.length - 1 ? recordedEvents[eventIndex + 1] : null;
      const delayToNextEvent = nextEvent ? Math.max(0, (nextEvent.time ?? 0) - (event.time ?? 0)) : 0;

      // Wait for the delay to the next event
      if (delayToNextEvent > 0) {
        await new Promise(resolve => setTimeout(resolve, delayToNextEvent));
      }

      // Check if playback was stopped
      if (!playingRef.current) {
        break;
      }

      // Process current event
      if (event.kind === "transaction" && event.transaction && event.transaction.changes && editorApiRef.current) {
        const state = editorApiRef.current.getState();
        if (state) {
          const changes = event.transaction.changes as any;
          const newDoc = changes.apply((state as any).doc).toString();
          editorApiRef.current.setDoc(newDoc);

          // Apply selection range if recorded
          if (event.selection) {
            editorApiRef.current.setSelection(event.selection);
          }
        }
      }

      if (event.kind === "file-switch" && event.fileName && editorApiRef.current) {
        // Switch to the file during playback
        const fileEntry = filesManager.files.get(event.fileName);
        if (fileEntry) {
          editorApiRef.current.setDoc(fileEntry.content);
        }
      }

      if (event.kind === "file-create") {
        // File was created during recording (for informational purposes during playback)
        const fileName = event.fileName ?? "";
        if (fileName) {
          filesManager.createFile(fileName, event.fileContent ?? "");
        }
      }

      if (event.kind === "mouse" && event.mouse && cursorRef.current) {
        // Position cursor according to recorded coordinates (we store coords relative to editor rect)
        // Use left/top and keep the translate(-50%,-50%) so the dot centers on the point.
        cursorRef.current.style.left = `${event.mouse.x}px`;
        cursorRef.current.style.top = `${event.mouse.y}px`;
      }

      eventIndex++;
    }

    // Clear the timer when playback ends
    clearInterval(timerInterval);

    // Hide cursor overlay when playback ends
    if (cursorRef.current) {
      cursorRef.current.style.display = "none";
    }

    // Stop playing flag
    playingRef.current = false;
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      playingRef.current = true;
      setIsPlaying(true);
      void handlePlayback();
    }
    else {
      playingRef.current = false;
      setIsPlaying(false);
    }
  };

  // Safe code evaluation using Web Worker or isolated context
  const evaluateCode = async (code: string): Promise<TestResults> => {
    const details: TestResults["details"] = [];
    let passedCount = 0;

    for (const testCase of TEST_CASES) {
      try {
        // Create a safe execution context
        // eslint-disable-next-line no-new-func
        const userFunction = new Function("nums", "target", code);
        const result = userFunction(testCase.input.nums, testCase.input.target);

        // Validate the result
        const expected = [...testCase.expected].sort((a, b) => a - b);
        const actual = Array.isArray(result) ? [...result].sort((a, b) => a - b) : null;

        if (!actual || actual.length !== 2 || actual[0] !== expected[0] || actual[1] !== expected[1]) {
          const failureMessage = `Input nums=${JSON.stringify(testCase.input.nums)} | target=${testCase.input.target} | Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
          details.push({
            name: testCase.name,
            passed: false,
            error: failureMessage,
          });
        }
        else {
          details.push({
            name: testCase.name,
            passed: true,
          });
          passedCount += 1;
        }
      }
      catch (error) {
        const runtimeMessage = `Input nums=${JSON.stringify(testCase.input.nums)} | target=${testCase.input.target} | ${error instanceof Error ? error.message : String(error)}`;
        details.push({
          name: testCase.name,
          passed: false,
          error: runtimeMessage,
        });
      }
    }

    return {
      passed: passedCount,
      total: TEST_CASES.length,
      details,
    };
  };

  const testStatusMap = useMemo(() => {
    if (!testResults) {
      return null;
    }
    const map = new Map<string, TestDetail>();
    for (const detail of testResults.details) {
      map.set(detail.name, detail);
    }
    return map;
  }, [testResults]);

  const handleSubmit = async () => {
    if (!editorApiRef.current)
      return;

    setIsSubmitting(true);
    try {
      const state = editorApiRef.current.getState();
      if (!state) {
        setIsSubmitting(false);
        return;
      }
      const code = state.doc.toString();
      if (!code.trim()) {
        // eslint-disable-next-line no-alert
        window.alert("Please write some code before submitting");
        setIsSubmitting(false);
        return;
      }

      const results = await evaluateCode(code);
      setTestResults(results);
    }
    catch (error) {
      setTestResults({
        passed: 0,
        total: 4,
        details: [
          {
            name: "Code Execution",
            passed: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const resetToStarter = () => {
    filesManager.resetToStarter(starterCode);
    setTestResults(null);
  };

  return (
    <div
      onMouseMove={recorder.recordMouseEvent}
      className="flex h-screen flex-col"
    >
      <div
        className="bg-background border-b p-4"
      >
        <div className="flex items-center gap-2">
          <Button onClick={handleToggleRecording}>
            {recorder.recording ? "Stop Recording" : "Start Recording"}
          </Button>
          <Button onClick={togglePlayback}>
            {isPlaying ? "Stop" : "Play"}
          </Button>
          <div className="text-muted-foreground ml-4 text-xs">
            Playback time:
            {" "}
            {formatDisplayTime(playbackTime)}
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>

        </div>
      </div>

      {/* Main content area: sidebar + editor */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar: File explorer */}
        <FileSidebar
          files={filesManager.files}
          activeFile={filesManager.activeFile}
          onCreateFile={(name) => {
            recorder.recordFileCreate(name);
            filesManager.createFile(name);
          }}
          onSelectFile={(name) => {
            recorder.recordFileSwitch(name);
            filesManager.selectFile(name);
          }}
        />

        {/* Center: Editor and tabs */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <FileTabs
            files={filesManager.files}
            activeFile={filesManager.activeFile}
            onSelectFile={(name) => {
              recorder.recordFileSwitch(name);
              filesManager.selectFile(name);
            }}
          />
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            <CodeMirrorEditor
              value={filesManager.files.get(filesManager.activeFile)?.content ?? ""}
              onUserTransaction={(tr) => {
                const selection = tr.selection ? { anchor: tr.selection.main.anchor, head: tr.selection.main.head } : undefined;
                recorder.recordTransaction(tr, selection);
                setTestResults(prev => (prev ? null : prev));
              }}
              containerRef={editor}
              setExternalApiRef={editorApiRef as any}
            />
            <CursorOverlay cursorRef={cursorRef} />
          </div>
        </div>

        <ProblemPanel
          testResults={testResults}
          testCases={TEST_CASES}
          testStatusMap={testStatusMap}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onReset={resetToStarter}
        />
      </div>

      <PlaybackControls
        playbackTime={playbackTime}
        isPlaying={isPlaying}
        onSeek={time => setPlaybackTime(time)}
        onPlay={togglePlayback}
        onPause={togglePlayback}
        recordedEvents={recordedEvents}
        recording={recorder.recording}
      />
    </div>
  );
}
