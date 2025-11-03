"use client";

import { useRef, useState } from "react";

import type { RecordedEvent } from "~/types/coding-session";

import { CodeMirrorEditor, CursorOverlay } from "~/components/coding-session/editor";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { RecordingList } from "~/components/recording-list";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { useFilesManager, usePlayer, useRecorder, useTestRunner } from "~/hooks/coding-session";
import { loadRecordingAction, saveRecordingAction } from "~/lib/actions/recordings";
import { deserializeEvent, serializeEvent } from "~/lib/coding-session/events";
import { TWO_SUM_PROBLEM } from "~/lib/coding-session/tests/two-sum";
import { formatDisplayTime } from "~/lib/coding-session/time";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const problem = TWO_SUM_PROBLEM;

  // Initialize hooks
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const editorApiRef = useRef<{
    setDoc: (content: string) => void;
    setSelection: (selection: { anchor: number; head: number }) => void;
    getState: () => { doc: { toString: () => string } } | null;
  } | null>(null);

  const filesManager = useFilesManager(problem.starterCode, editorApiRef);
  const recorder = useRecorder(
    event => setRecordedEvents(prev => [...prev, event]),
    () => filesManager.activeFile,
    editor,
  );

  // Keep for playback control
  const initialStateRef = useRef<any | null>(null);

  // Initialize player hook
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const player = usePlayer({
    recordedEvents,
    filesManager,
    editorApiRef,
    initialStateRef,
    cursorRef,
    onPlaybackTimeChange: setPlaybackTime,
    onPlaybackStateChange: setIsPlaying,
  });

  // Initialize test runner hook
  const tester = useTestRunner({
    testCases: problem.testCases,
    editorApiRef,
    onResultsChange: () => {
      // Callback for when results change
    },
  });

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

  const togglePlayback = () => {
    if (!player.isPlaying) {
      void player.play();
    }
    else {
      player.pause();
    }
  };

  const resetToStarter = () => {
    filesManager.resetToStarter(problem.starterCode);
    tester.reset();
  };

  const handleSaveRecording = async () => {
    if (recordedEvents.length === 0) {
      console.warn("No recording to save. Please record a session first.");
      return;
    }

    // TODO: Replace with proper dialog UI component
    // eslint-disable-next-line no-alert
    const title = prompt("Enter a title for this recording:");
    if (!title || !title.trim()) {
      return;
    }

    setSaveStatus("saving");

    try {
      // convert the Map to a serializable object
      const filesObject: Record<string, { name: string; content: string }> = {};
      for (const [fileName, fileData] of filesManager.files) {
        filesObject[fileName] = fileData;
      }

      // serialize the events client side before sending to server
      const serializedEvents = recordedEvents.map(serializeEvent);

      const initialCode = initialStateRef.current?.doc.toString() ?? problem.starterCode;

      await saveRecordingAction({
        title: title.trim(),
        problem,
        recordedEvents: serializedEvents,
        initialCode,
        files: filesObject,
        activeFile: filesManager.activeFile,
        // instructorId: undefined, // TODO: add when auth is fleshed out (#66)
      });

      setSaveStatus("saved");

      setTimeout(() => setSaveStatus("idle"), 3000);
    }
    catch (error) {
      console.error("Failed to save recording:", error);
      setSaveStatus("error");

      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleLoadRecording = async (recordingId: string) => {
    try {
      const result = await loadRecordingAction({ id: recordingId });
      const recording = result.data!.recording;

      setRecordedEvents([]);
      setPlaybackTime(0);
      setIsPlaying(false);

      const deserializedEvents = recording.events.map(deserializeEvent);
      setRecordedEvents(deserializedEvents);

      const filesMap = new Map<string, { name: string; content: string }>();
      Object.entries(recording.files).forEach(([fileName, content]) => {
        filesMap.set(fileName, { name: fileName, content });
      });

      filesManager.loadFiles(filesMap, recording.activeFile);

      initialStateRef.current = { doc: { toString: () => recording.initialCode } } as any;
    }
    catch (error) {
      console.error("Failed to load recording:", error);
      console.warn("Failed to load recording. See console for details.");
    }
  };

  const saveButtonLabel = () => {
    switch (saveStatus) {
      case "idle":
        return "Save Recording";
      case "saving":
        return "Saving...";
      case "saved":
        return "✓ Saved";
      case "error":
        return "✗ Error";
      default:
        return "Save Recording";
    }
  };

  return (
    <div
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
          {!recorder.recording && recordedEvents.length > 0 && (
            <Button
              onClick={handleSaveRecording}
              disabled={saveStatus === "saving"}
              variant={saveStatus === "saved" ? "default" : saveStatus === "error" ? "destructive" : "secondary"}
            >
              {saveButtonLabel()}
            </Button>
          )}
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

      <div className="flex flex-1 overflow-hidden">
        {!recorder.recording && (
          <div className="bg-background w-80 border-r">
            <RecordingList onSelectRecording={handleLoadRecording} />
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <CodeMirrorEditor
            value={filesManager.files.get(filesManager.activeFile)?.content ?? ""}
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
            onUserTransaction={(tr) => {
              const selection = tr.selection ? { anchor: tr.selection.main.anchor, head: tr.selection.main.head } : undefined;
              recorder.recordTransaction(tr, selection);
            }}
            onEditorMouseMove={recorder.recordMouseEvent}
            containerRef={editor}
            setExternalApiRef={editorApiRef as any}
          >
            <CursorOverlay cursorRef={cursorRef} />
          </CodeMirrorEditor>
        </div>

        <ProblemPanel
          problem={problem}
          testResults={tester.testResults}
          testStatusMap={tester.testStatusMap}
          isSubmitting={tester.isSubmitting}
          onSubmit={tester.submit}
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
