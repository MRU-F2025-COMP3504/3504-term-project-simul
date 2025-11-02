"use client";

import type { EditorState } from "@codemirror/state";

import { useRef, useState } from "react";

import type { EditorAPI, RecordedEvent } from "~/types/coding-session";

import { CodeMirrorEditor, CursorOverlay } from "~/components/coding-session/editor";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { useFilesManager, usePlayer, useRecorder, useTestRunner } from "~/hooks/coding-session";
import { TWO_SUM_PROBLEM } from "~/lib/coding-session/tests/two-sum";
import { formatDisplayTime } from "~/lib/coding-session/time";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);

  const problem = TWO_SUM_PROBLEM;

  // Initialize hooks
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const editorApiRef = useRef<EditorAPI | null>(null);

  const filesManager = useFilesManager(problem.starterCode, editorApiRef);
  const recorder = useRecorder(
    event => setRecordedEvents(prev => [...prev, event]),
    () => filesManager.activeFile,
    editor,
  );

  // Keep for playback control
  const initialStateRef = useRef<EditorState | null>(null);

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
      initialStateRef.current = editorApiRef.current?.getState() ?? null;
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
