"use client";

import type { MouseEvent } from "react";

import { useCallback, useRef, useState } from "react";

import type { RecordedEvent } from "~/types/coding-session";

import { positionWithin } from "~/lib/coding-session/dom";

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
) {
  const [recording, setRecording] = useState(false);
  const recordingStartTime = useRef<number>(0);

  /**
   * Record a transaction (code edit)
   *
   * Extracts the transaction, selection, and relative timestamp.
   * Only records if recording is active.
   *
   * @param tr - CodeMirror Transaction object
   * @param selection - Current editor selection {anchor, head}
   */
  const recordTransaction = useCallback(
    (
      tr: any,
      selection?: { anchor: number; head: number },
      docSnapshot?: string,
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
        selection,
        docSnapshot,
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
   * Called before beginning to capture events.
   */
  const startRecording = useCallback(() => {
    setRecording(true);
    recordingStartTime.current = performance.now();
  }, []);

  /**
   * Stop recording
   *
   * Sets recording state to false. Events will no longer be captured.
   */
  const stopRecording = useCallback(() => {
    setRecording(false);
  }, []);

  /**
   * Toggle recording on/off
   */
  const toggleRecording = useCallback(() => {
    if (recording) {
      stopRecording();
    }
    else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  return {
    recording,
    recordTransaction,
    recordMouseEvent,
    recordFileCreate,
    recordFileSwitch,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
