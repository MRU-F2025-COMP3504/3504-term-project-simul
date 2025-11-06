import { useCallback } from "react";

import { useInstructorSession } from "~/app/dashboard/instructor/instructor-session-context";

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
    startRecording: () => void;
    stopRecording: () => void;
  },
  filesManager: {
    activeFile: string;
    updateFileContent: (name: string, content: string) => void;
  },
) {
  const {
    editorApiRef,
    setRecordedEvents,
    setPlaybackTime,
    initialStateRef,
  } = useInstructorSession();

  const toggleRecording = useCallback(() => {
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
  }, [
    recorder,
    filesManager,
    editorApiRef,
    setRecordedEvents,
    setPlaybackTime,
    initialStateRef,
  ]);

  return { toggleRecording };
}
