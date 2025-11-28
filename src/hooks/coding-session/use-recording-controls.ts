import { useCallback } from "react";

import type { FilesManager } from "~/hooks/coding-session/use-files-manager";

import { useInstructorSession } from "~/app/dashboard/instructor/instructor-session-context";

import { useEditorController } from "./use-editor-controller";

/**
 * Hook for managing recording start/stop controls
 *
 * Handles the state transitions when starting and stopping recordings:
 * - Starting: captures initial editor state and resets events
 * - Stopping: saves current editor state to files
 */
export function useRecordingControls(
  recorder: {
    recording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
  },
  filesManager: FilesManager,
) {
  const {
    editorApiRef,
    setRecordedEvents,
    setPlaybackTime,
    initialStateRef,
  } = useInstructorSession();
  const editorController = useEditorController(editorApiRef);

  const toggleRecording = useCallback(async () => {
    if (!recorder.recording) {
      // Starting recording - capture initial state and reset events
      initialStateRef.current = editorController.getEditorState();
      setRecordedEvents([]);
      setPlaybackTime(0);
      await recorder.startRecording();
    }
    else {
      // Stopping recording - save current editor state to files

      const state = editorController.getEditorState();
      if (state) {
        filesManager.updateFileContent(filesManager.activeFile, state);
      }

      recorder.stopRecording();
    }
  }, [
    recorder,
    filesManager,
    setRecordedEvents,
    setPlaybackTime,
    initialStateRef,
    editorController,
  ]);

  return { toggleRecording };
}
