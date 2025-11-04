"use client";

import { EditorState as CMEditorState } from "@codemirror/state";
import { useRef, useState } from "react";
import { toast } from "sonner";

import type { RecordedEvent } from "~/types/coding-session";

import { CodeMirrorEditor, CursorOverlay } from "~/components/coding-session/editor";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { RecordingList } from "~/components/recording-list";
import { useFilesManager, usePlayer, useRecorder, useTestRunner } from "~/hooks/coding-session";
import { useSaveRecording } from "~/hooks/coding-session/use-save-recording";
import { loadRecordingAction } from "~/lib/actions/recordings";
import { deserializeEvent } from "~/lib/coding-session/events";
import { TWO_SUM_PROBLEM } from "~/lib/coding-session/tests/two-sum";

import InstructorToolbar from "./instructor-toolbar";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);

  const problem = TWO_SUM_PROBLEM;

  // Initialize hooks
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const editorApiRef = useRef<{
    setDoc: (content: string) => void;
    setSelection: (selection: { anchor: number; head: number }) => void;
    getState: () => CMEditorState | null;
  } | null>(null);

  const filesManager = useFilesManager(problem.starterCode, editorApiRef);
  const recorder = useRecorder(
    event => setRecordedEvents(prev => [...prev, event]),
    () => filesManager.activeFile,
    editor,
  );

  // Keep for playback control
  const initialStateRef = useRef<CMEditorState | null>(null);

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
          const currentContent = state.doc.toString();
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

  const {
    showSaveDialog,
    openSaveDialog,
    saveTitleInput,
    setSaveTitleInput,
    performSaveRecording,
    closeSaveDialog,
    saveStatus,
  } = useSaveRecording({ recordedEvents, filesManager, initialStateRef, problem });

  const handleLoadRecording = async (recordingId: string) => {
    try {
      const result = await loadRecordingAction({ id: recordingId });
      if (!result.data || !result.data.recording) {
        throw new Error("No recording data returned from loadRecordingAction");
      }

      const recording = result.data.recording;

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

      initialStateRef.current = CMEditorState.create({ doc: recording.initialCode });
    }
    catch (error) {
      console.error("Failed to load recording:", error);
      toast.error("Failed to load recording. Please try again.");
    }
  };

  // toolbar handles save button label / UI now

  return (
    <div className="flex h-screen flex-col">

      <InstructorToolbar
        isRecording={recorder.recording}
        onToggleRecordingAction={handleToggleRecording}
        isPlaying={isPlaying}
        onTogglePlaybackAction={togglePlayback}
        recordedEventsCount={recordedEvents.length}
        playbackTime={playbackTime}

        showSaveDialog={showSaveDialog}
        openSaveDialogAction={openSaveDialog}
        closeSaveDialogAction={closeSaveDialog}
        saveTitleInput={saveTitleInput}
        setSaveTitleInputAction={setSaveTitleInput}
        performSaveRecordingAction={performSaveRecording}
        saveStatus={saveStatus}
      />

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
            setExternalApiRef={editorApiRef}
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
