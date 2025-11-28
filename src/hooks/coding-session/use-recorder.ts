"use client";

import type { MouseEvent } from "react";

import { useCallback, useRef, useState } from "react";

import type { RecordedEvent } from "~/types/coding-session";

import { positionWithin } from "~/lib/coding-session/dom";

import { useAudioRecorder } from "./use-audio-recorder";

/**
 * Hook for recording coding session events
 *
 * Handles:
 * - Recording code editor transactions (insertions, deletions, replacements)
 * - Recording mouse movements and clicks
 * - Recording file creation and switching events
 * - Normalizing timestamps to relative times from recording start
 *
 * Recording can be controlled via toggleRecording().
 * The hook manages timing, event collection, and cleanup.
 *
 * @param onEvent - Callback fired each time an event is recorded
 * @param getActiveFile - Function to get the currently active file name
 * @param editorContainer - Reference to the editor DOM element (for mouse coordinate calculation)
 * @returns Object with recording state and event recording methods
 */
export function useRecorder(
  onEvent: (event: RecordedEvent) => void,
  getActiveFile: () => string,
  editorContainer: React.RefObject<HTMLDivElement | null>,
  options?: { enableAudio?: boolean },
) {
  const [recording, setRecording] = useState(false);
  const recordingStartTime = useRef<number>(0);

  // Audio recording integration
  const audioRecorder = useAudioRecorder({
    onAudioChunk: (audioBlob: Blob, timestamp: number) => {
      // Calculate relative time from recording start, just like other events
      const relativeTime = recordingStartTime.current > 0 ? timestamp - recordingStartTime.current : 0;

      console.warn("AUDIO CHUNK CALLBACK:", {
        recording,
        audioBlobSize: audioBlob.size,
        absoluteTimestamp: timestamp,
        relativeTime,
        audioBlobType: audioBlob.type,
        recordingStartTime: recordingStartTime.current,
      });
      // Always save audio chunks if we have a recording session active
      // Check both current recording state AND if we have a valid start time
      if (recording || recordingStartTime.current > 0) {
        onEvent({
          time: relativeTime,
          kind: "audio-chunk",
          audioData: audioBlob,
        });
      }
    },
    chunkInterval: 1000, // 1 second chunks for smooth playback
  });

  /**
   * Record a transaction (code edit)
   *
   * Extracts the transaction, selection, and relative timestamp.
   * Only records if recording is active.
   *
   * @param tr - CodeMirror Transaction object
   */
  const recordTransaction = useCallback(
    (
      tr: any,
    ) => {
      if (!recording)
        return;

      const time = performance.now() - recordingStartTime.current;

      const activeFile = getActiveFile();

      onEvent({
        time,
        kind: "transaction",
        fileName: activeFile,
        transaction: tr,
      });
    },
    [recording, onEvent, getActiveFile],
  );

  /**
   * Record a mouse event (move, click, etc.)
   *
   * Converts absolute client coordinates to coordinates relative to the
   * editor container. Only records if recording is active.
   *
   * @param event - React MouseEvent
   */
  const recordMouseEvent = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!recording)
        return;
      if (!editorContainer.current)
        return;

      const { x, y } = positionWithin(
        editorContainer.current,
        event.clientX,
        event.clientY,
      );

      const time = performance.now() - recordingStartTime.current;

      onEvent({
        time,
        kind: "mouse",
        mouse: {
          x,
          y,
          type: event.type,
          button: (event as any).button,
        },
      });
    },
    [recording, onEvent, editorContainer],
  );

  /**
   * Record a file creation event
   *
   * Only records if recording is active.
   *
   * @param fileName - Name of the created file
   * @param fileContent - Initial content of the file
   */
  const recordFileCreate = useCallback(
    (fileName: string, fileContent: string = "") => {
      if (!recording)
        return;

      const time = performance.now() - recordingStartTime.current;

      onEvent({
        time,
        kind: "file-create",
        fileName,
        fileContent,
      });
    },
    [recording, onEvent],
  );

  /**
   * Record a file switch event
   *
   * Only records if recording is active.
   *
   * @param fileName - Name of the file being switched to
   */
  const recordFileSwitch = useCallback(
    (fileName: string) => {
      if (!recording)
        return;

      const time = performance.now() - recordingStartTime.current;

      onEvent({
        time,
        kind: "file-switch",
        fileName,
      });
    },
    [recording, onEvent],
  );

  /**
   * Start recording
   *
   * Initializes the recording start time and sets recording state to true.
   * Also starts audio recording if enabled.
   */
  const startRecording = useCallback(async () => {
    console.warn("RECORDER: Starting recording, audio config:", {
      enableAudio: options?.enableAudio,
      isSupported: audioRecorder.isSupported,
      audioError: audioRecorder.error,
    });

    setRecording(true);
    recordingStartTime.current = performance.now();

    // Start audio recording if enabled and supported
    if (options?.enableAudio && audioRecorder.isSupported) {
      const success = await audioRecorder.startRecording();
      console.warn("RECORDER: Audio start result:", success);
    }
  }, [options?.enableAudio, audioRecorder]);

  /**
   * Stop recording
   *
   * Sets recording state to false. Events will no longer be captured.
   * Also stops audio recording.
   */
  const stopRecording = useCallback(() => {
    setRecording(false);

    // Stop audio recording
    if (audioRecorder.isRecording) {
      audioRecorder.stopRecording();
    }

    // Clear recording start time after a short delay to allow final audio chunks
    setTimeout(() => {
      recordingStartTime.current = 0;
    }, 100);
  }, [audioRecorder]);

  /**
   * Toggle recording on/off
   */
  const toggleRecording = useCallback(async () => {
    if (recording) {
      stopRecording();
    }
    else {
      await startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  return {
    recording,
    audioRecording: audioRecorder.isRecording,
    audioSupported: audioRecorder.isSupported,
    audioError: audioRecorder.error,
    recordTransaction,
    recordMouseEvent,
    recordFileCreate,
    recordFileSwitch,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
