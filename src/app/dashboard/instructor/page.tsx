"use client";

import { EditorState } from "@codemirror/state";
import { useMemo } from "react";

import { CodeMirrorEditor, CursorOverlay } from "~/components/coding-session/editor";
import { PlaybackControls } from "~/components/coding-session/playback-controls";
import { ProblemPanel } from "~/components/coding-session/problem/problem-panel";
import { RecordingList } from "~/components/recording-list";
import { useFilesManager, useLoadRecording, usePlayer, useRecorder, useRecordingControls, useTestRunner } from "~/hooks/coding-session";
import { useSaveRecording } from "~/hooks/coding-session/use-save-recording";
import { TWO_SUM_PROBLEM } from "~/lib/coding-session/tests/two-sum";

import { useInstructorSession } from "./instructor-session-context";
import InstructorToolbar from "./instructor-toolbar";

export default function CodeEditor() {
  const {
    editorApiRef,
    cursorRef,
    editorContainerRef,
    recordedEvents,
    setRecordedEvents,
    setPlaybackTime,
    setIsPlaying,
    initialStateRef,
    isLoadingRecording,
  } = useInstructorSession();

  const problem = TWO_SUM_PROBLEM;

  const startingState = useMemo(() => {
    const state = EditorState.create({ doc: problem.starterCode });
    initialStateRef.current = state;
    return state;
  }, [problem.starterCode, initialStateRef]);

  const filesManager = useFilesManager(startingState, editorApiRef);

  const recorder = useRecorder(
    event => setRecordedEvents(prev => [...prev, event]),
    () => filesManager.activeFile,
    editorContainerRef,
  );

  const { toggleRecording } = useRecordingControls(recorder, filesManager);
  const { loadRecording } = useLoadRecording(filesManager);

  const player = usePlayer({
    recordedEvents,
    filesManager,
    editorApiRef,
    initialStateRef,
    cursorRef,
    onPlaybackTimeChange: setPlaybackTime,
    onPlaybackStateChange: setIsPlaying,
    isLoadingRecording,
  });

  // Initialize test runner hook
  const tester = useTestRunner({
    testCases: problem.testCases,
    editorApiRef,
    onResultsChange: () => {
      // Callback for when results change
    },
  });

  const togglePlayback = () => {
    if (!player.isPlaying) {
      void player.play();
    }
    else {
      player.pause();
    }
  };

  const resetToStarter = () => {
    filesManager.resetToStarter(startingState);
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

  return (
    <div className="flex h-screen flex-col">

      <InstructorToolbar
        isRecording={recorder.recording}
        onToggleRecordingAction={toggleRecording}
        onTogglePlaybackAction={togglePlayback}

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
            <RecordingList onSelectRecording={loadRecording} />
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <CodeMirrorEditor
            value={startingState.doc.toString()}
            files={filesManager.files}
            activeFile={filesManager.activeFile}
            onCreateFile={(name) => {
              filesManager.createFile(name, EditorState.create({ doc: "" }));
              recorder.recordFileCreate(name);
            }}
            onSelectFile={(name) => {
              recorder.recordFileSwitch(name);
              filesManager.selectFile(name);
            }}
            onUserTransaction={(tr) => {
              recorder.recordTransaction(tr);
            }}
            onEditorMouseMove={recorder.recordMouseEvent}
            containerRef={editorContainerRef}
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
        onSeek={player.seek}
        onPlay={togglePlayback}
        onPause={togglePlayback}
        recording={recorder.recording}
        isLoadingRecording={isLoadingRecording}
      />
    </div>
  );
}
