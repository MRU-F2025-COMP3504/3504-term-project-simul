import { EditorState as CMEditorState } from "@codemirror/state";
import { useCallback } from "react";
import { toast } from "sonner";

import type { File } from "~/types/coding-session";

import { useInstructorSession } from "~/app/dashboard/instructor/instructor-session-context";
import { loadRecordingAction } from "~/lib/actions/recordings";
import { deserializeEvent } from "~/lib/coding-session/events";

import type { FilesManager } from "./use-files-manager";

/**
 * Hook for loading saved recordings
 *
 * Handles:
 * - Loading recording data from the server
 * - Deserializing events
 * - Restoring file state
 * - Setting initial editor state
 * - Resetting playback state
 */
export function useLoadRecording(filesManager: FilesManager) {
  const {
    setRecordedEvents,
    setPlaybackTime,
    setIsPlaying,
    initialStateRef,
    setIsLoadingRecording,
  } = useInstructorSession();

  const loadRecording = useCallback(
    async (recordingId: string) => {
      try {
        setIsLoadingRecording(true);

        const result = await loadRecordingAction({ id: recordingId });
        if (!result.data || !result.data.recording) {
          throw new Error("No recording data returned from loadRecordingAction");
        }

        const recording = result.data.recording;

        // Reset playback state
        setRecordedEvents([]);
        setPlaybackTime(0);
        setIsPlaying(false);

        // Deserialize and load before updates
        const deserializedEvents = recording.events.map(deserializeEvent);
        const initialState = CMEditorState.create({ doc: recording.initialCode });

        // Restore file state
        // create EditorState for each file
        const filesMap = new Map<string, File>();

        Object.entries(recording.files).forEach(([fileName, fileData]) => {
          const content = (fileData as { name: string; content: string }).content;
          const newFile: File = { fileName, content: CMEditorState.create({ doc: content }) };
          filesMap.set(fileName, newFile);
        });

        // Apply file state first
        filesManager.loadFiles(filesMap, recording.activeFile);

        // Set initial state ref before updating events
        // ref is set before the memo re-runs
        initialStateRef.current = initialState;

        // triggers memo re-run
        setRecordedEvents(deserializedEvents);
      }
      catch (error) {
        console.error("Failed to load recording:", error);
        toast.error("Failed to load recording. Please try again.");
      }
      finally {
        setIsLoadingRecording(false);
      }
    },
    [filesManager, setRecordedEvents, setPlaybackTime, setIsPlaying, initialStateRef, setIsLoadingRecording],
  );

  return { loadRecording };
}
