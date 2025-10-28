"use client";

import { useRef, useState } from "react";

import type { RecordedEvent } from "~/types/coding-session";

import { CodeMirrorEditor, CursorOverlay, FileTabs } from "~/components/coding-session/editor";
import { FileSidebar } from "~/components/coding-session/file-sidebar";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { useFilesManager, usePlayer, useRecorder, useTestRunner } from "~/hooks/coding-session";
import { TWO_SUM_STARTER_CODE, TWO_SUM_TEST_CASES } from "~/lib/coding-session/tests/two-sum";
import { formatDisplayTime } from "~/lib/coding-session/time";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);

  const starterCode = TWO_SUM_STARTER_CODE;
  const TEST_CASES = TWO_SUM_TEST_CASES;

  // Initialize hooks
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
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
    testCases: TEST_CASES,
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
    filesManager.resetToStarter(starterCode);
    tester.reset();
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

      <div className="flex flex-1 overflow-hidden">
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

        <div
          className="flex flex-1 flex-col overflow-hidden"
        >
          <FileTabs
            files={filesManager.files}
            activeFile={filesManager.activeFile}
            onSelectFile={(name) => {
              recorder.recordFileSwitch(name);
              filesManager.selectFile(name);
            }}
          />
          <div
            className="relative flex-1 overflow-hidden"
          >
            <CodeMirrorEditor
              value={filesManager.files.get(filesManager.activeFile)?.content ?? ""}
              onUserTransaction={(tr) => {
                const selection = tr.selection ? { anchor: tr.selection.main.anchor, head: tr.selection.main.head } : undefined;
                recorder.recordTransaction(tr, selection);
              }}
              containerRef={editor}
              setExternalApiRef={editorApiRef as any}
            />
            <CursorOverlay cursorRef={cursorRef} />
          </div>
        </div>

        <ProblemPanel
          testResults={tester.testResults}
          testCases={TEST_CASES}
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
