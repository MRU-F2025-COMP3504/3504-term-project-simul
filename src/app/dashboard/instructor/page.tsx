"use client";
import type { ChangeSet, EditorState as CMEditorState } from "@codemirror/state";
import type { MouseEvent } from "react";

import { Transaction } from "@codemirror/state";
import { useMemo, useRef, useState } from "react";

import type { FileEntry, RecordedEvent, TestDetail, TestResults } from "~/types/coding-session";

import { CodeMirrorEditor, CursorOverlay, FileTabs } from "~/components/coding-session/editor";
import { FileSidebar } from "~/components/coding-session/file-sidebar";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { TWO_SUM_STARTER_CODE, TWO_SUM_TEST_CASES } from "~/lib/coding-session/tests/two-sum";
import { formatDisplayTime } from "~/lib/coding-session/time";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [recording, setRecording] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const starterCode = TWO_SUM_STARTER_CODE;
  const TEST_CASES = TWO_SUM_TEST_CASES;

  // Multi-file support
  const [files, setFiles] = useState<Map<string, FileEntry>>(() => new Map([["main.js", { name: "main.js", content: starterCode }]]));
  const [activeFile, setActiveFile] = useState("main.js");
  const initialStateRef = useRef<CMEditorState | null>(null);
  const initialFilesRef = useRef<Map<string, FileEntry> | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(false);
  const editorApiRef = useRef<{
    setDoc: (content: string) => void;
    setSelection: (selection: { anchor: number; head: number }) => void;
    getState: () => CMEditorState | null;
  } | null>(null);

  function recordChanges(tr: Transaction) {
    if (!recording)
      return;
    // Only record user-driven transactions
    if (tr.annotation(Transaction.userEvent)) {
      let time = tr.annotation(Transaction.time) ?? Date.now();
      // Convert to relative time from start of recording
      if (recordingStartTimeRef.current) {
        time = time - recordingStartTimeRef.current;
      }
      // Extract selection range from the transaction's state
      const selection = tr.selection ? { anchor: tr.selection.main.anchor, head: tr.selection.main.head } : undefined;
      setRecordedEvents(prev => [...prev, { time, kind: "transaction", fileName: activeFile, transaction: tr, selection }]);
      setTestResults(prev => (prev ? null : prev));
    }
  }

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
          const changes: ChangeSet = event.transaction.changes;
          const newDoc = changes.apply(state.doc).toString();
          editorApiRef.current.setDoc(newDoc);

          // Apply selection range if recorded
          if (event.selection) {
            editorApiRef.current.setSelection(event.selection);
          }
        }
      }

      if (event.kind === "file-switch" && event.fileName && editorApiRef.current) {
        // Switch to the file during playback
        const fileEntry = files.get(event.fileName);
        if (fileEntry) {
          editorApiRef.current.setDoc(fileEntry.content);
        }
      }

      if (event.kind === "file-create") {
        // File was created during recording (for informational purposes during playback)
        const fileName = event.fileName ?? "";
        const newFile: FileEntry = { name: fileName, content: event.fileContent ?? "" };
        if (fileName) {
          setFiles((prev) => {
            const newMap = new Map(prev);
            newMap.set(fileName, newFile);
            return newMap;
          });
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

  const calculatePlaybackTime = () => {
    if (recordedEvents.length < 2) {
      setPlaybackTime(0);
      return 0;
    }
    const firstEvent = recordedEvents[0];
    const lastEvent = recordedEvents[recordedEvents.length - 1];
    const playback = (lastEvent.time ?? 0) - (firstEvent.time ?? 0);
    setPlaybackTime(playback);
    return playback;
  };

  // Record a file switch
  const switchFile = (fileName: string) => {
    if (activeFile === fileName || !editorApiRef.current)
      return;

    // Save current file content before switching
    const state = editorApiRef.current.getState();
    if (state) {
      const currentContent = state.doc.toString();
      setFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(activeFile, { name: activeFile, content: currentContent });
        return newMap;
      });
    }

    // Switch to new file
    setActiveFile(fileName);

    // Update editor with new file content
    const fileEntry = files.get(fileName);
    if (fileEntry && editorApiRef.current) {
      editorApiRef.current.setDoc(fileEntry.content);
    }

    // Record file switch if recording
    if (recording) {
      let time = Date.now();
      // Convert to relative time from start of recording
      if (recordingStartTimeRef.current) {
        time = time - recordingStartTimeRef.current;
      }
      setRecordedEvents(prev => [...prev, { time, kind: "file-switch", fileName }]);
    }
  };

  // Create a new file
  const createNewFile = (fileName: string) => {
    if (files.has(fileName))
      return;

    const newFile: FileEntry = { name: fileName, content: "" };
    setFiles(prev => new Map(prev).set(fileName, newFile));

    if (recording) {
      let time = Date.now();
      // Convert to relative time from start of recording
      if (recordingStartTimeRef.current) {
        time = time - recordingStartTimeRef.current;
      }
      setRecordedEvents(prev => [...prev, { time, kind: "file-create", fileName, fileContent: "" }]);
    }
  };

  // record mouse events using event listeners
  const recordMouseEvents = (event: MouseEvent<HTMLDivElement>) => {
    if (!recording)
      return;
    if (!editor.current)
      return;
    const rect = editor.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let time = Date.now();
    // Convert to relative time from start of recording
    if (recordingStartTimeRef.current) {
      time = time - recordingStartTimeRef.current;
    }
    setRecordedEvents(prev => [...prev, { time, kind: "mouse", mouse: { x, y, type: event.type, button: (event as any).button } }]);
  };

  const toggleRecording = async () => {
    if (!recording) {
      // starting recording
      recordingStartTimeRef.current = Date.now();
      initialStateRef.current = editorApiRef.current?.getState() ?? null;
      initialFilesRef.current = new Map(files);
      setRecordedEvents([]);
      setPlaybackTime(0);
      setRecording(true);
    }
    else {
      // stopping recording
      // Save current file content before stopping
      if (editorApiRef.current) {
        const state = editorApiRef.current.getState();
        if (state) {
          const currentContent = state.doc.toString();
          setFiles((prev) => {
            const newMap = new Map(prev);
            newMap.set(activeFile, { name: activeFile, content: currentContent });
            return newMap;
          });
        }
      }
      setRecording(false);
      calculatePlaybackTime();
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
    if (!editorApiRef.current)
      return;

    editorApiRef.current.setDoc(starterCode);

    setFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeFile, { name: activeFile, content: starterCode });
      return newMap;
    });

    setTestResults(null);
  };

  return (
    <div
      onMouseMove={recordMouseEvents}
      className="flex h-screen flex-col"
    >
      <div
        className="bg-background border-b p-4"
      >
        <div className="flex items-center gap-2">
          <Button onClick={toggleRecording}>
            {recording ? "Stop Recording" : "Start Recording"}
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
          files={files}
          activeFile={activeFile}
          onCreateFile={createNewFile}
          onSelectFile={switchFile}
        />

        {/* Center: Editor and tabs */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <FileTabs
            files={files}
            activeFile={activeFile}
            onSelectFile={switchFile}
          />

          {/* Editor container: relative so we can position the playback cursor over it */}
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            <CodeMirrorEditor
              value={files.get(activeFile)?.content ?? ""}
              onUserTransaction={recordChanges}
              containerRef={editor}
              setExternalApiRef={editorApiRef}
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
        recording={recording}
      />
    </div>
  );
}
