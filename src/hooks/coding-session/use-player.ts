/**
 * usePlayer Hook - Playback Engine for Recorded Coding Sessions
 *
 * Manages the playback of recorded coding events (edits, file operations, mouse movements).
 * Handles timeline progression, editor state restoration, and cursor position updates.
 *
 * Key Features:
 * - Replays editor transactions at correct timestamps
 * - Restores file state from recording start
 * - Displays cursor position during playback
 * - Maintains playback timeline and state
 * - Graceful pause/resume support
 *
 * Performance Notes:
 * - Uses refs for high-frequency updates (playback time, cursor position)
 * - Timer runs at 50ms intervals for smooth progress bar updates
 * - Does NOT store cursor position in component state (would cause excessive rerenders)
 *
 * @example
 * ```typescript
 * const player = usePlayer({
 *   recordedEvents,
 *   filesManager,
 *   editorApiRef,
 *   initialStateRef,
 *   cursorRef,
 *   onPlaybackTimeChange: setPlaybackTime,
 *   onPlaybackStateChange: setIsPlaying,
 * });
 *
 * // Start playback
 * await player.play();
 *
 * // Pause playback
 * player.pause();
 * ```
 */

import { EditorState } from "@codemirror/state";
import { useCallback, useMemo, useRef, useState } from "react";

import type { EditorAPI, File, GlobalEditorState, IndexRow, KeyFrame, RecordedEvent } from "~/types/coding-session";

import { cloneState, lowerBoundEvents, upperBoundKF } from "~/lib/coding-session/playback";

import type { FilesManager } from "./use-files-manager";

// Time bucket size for seek indexing and lookup
const BUCKET_MS = 250;

/**
 * API returned by usePlayer hook
 */
export type PlayerHandle = {
  /** Start playback of recorded events */
  play: () => Promise<void>;
  /** Pause current playback */
  pause: () => void;
  /** Seek to a specific time in the recording */
  seek: (time: number) => void;
  /** Whether playback is currently active */
  isPlaying: boolean;
  /** Current playback time in milliseconds */
  playbackTime: number;
};

/**
 * Configuration options for usePlayer hook
 */
type UsePlayerProps = {
  /** Array of recorded events to replay (created by useRecorder) */
  recordedEvents: RecordedEvent[];
  /** Files manager instance for switching files during playback */
  filesManager: FilesManager;
  /** Reference to CodeMirror editor API for setting document and selection */
  editorApiRef: React.RefObject<EditorAPI | null>;
  /** Reference to initial editor state (captured at recording start) */
  initialStateRef: React.RefObject<EditorState | null>;
  /** Reference to cursor overlay element for position updates */
  cursorRef: React.RefObject<HTMLDivElement | null>;
  /** Callback when playback time updates (for progress bar) */
  onPlaybackTimeChange: (time: number) => void;
  /** Callback when playback state changes (playing/paused) */
  onPlaybackStateChange: (isPlaying: boolean) => void;
  /** Whether a recording is currently being loaded */
  isLoadingRecording: boolean;
};

/**
 * Hook implementation for playback engine
 *
 * Manages playback of recorded coding session events and updates editor state accordingly.
 * Handles transaction playback, file switching, cursor position updates, and timeline management.
 *
 * @returns PlayerHandle with play(), pause(), isPlaying, and playbackTime
 */
export function usePlayer({
  recordedEvents,
  filesManager,
  editorApiRef,
  initialStateRef,
  cursorRef,
  onPlaybackTimeChange,
  onPlaybackStateChange,
  isLoadingRecording,
}: UsePlayerProps): PlayerHandle {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playingRef = useRef(false);
  const startingWallTime = useRef(0);
  const pausedAt = useRef(0);
  const rate = 1;
  const eventPointer = useRef(0);

  const { keyframes, index, events } = useMemo(() => {
    const initialState = initialStateRef.current;

    if (!initialState && recordedEvents.length > 0) {
      console.warn(
        "Building keyframes with incomplete initial state. "
        + "This may indicate a race condition during recording load.",
      );
    }

    const activeFile = {
      fileName: "main.js",
      content: initialState ?? EditorState.create(),
    };
    let state: GlobalEditorState = {
      files: new Map([[activeFile.fileName, activeFile]]),
      activeFile,
      mouse: { x: 0, y: 0 },
    };

    const keyframes: KeyFrame[] = [{ time: recordedEvents[0]?.time ?? 0, state: cloneState(state) }];

    const index: IndexRow[] = [];

    const KF_EVERY_N = 10;
    let lastBucketTime = keyframes[0].time;
    for (let i = 0; i < recordedEvents.length; i++) {
      const event = recordedEvents[i];
      state = reduce(state, event);
      // keyframe every N events or when enough time has passed
      if ((i + 1) % KF_EVERY_N === 0) {
        keyframes.push({ time: event.time!, state: cloneState(state) });
      }
      // time bucket index for fast seeks
      while (lastBucketTime + BUCKET_MS <= event.time!) {
        lastBucketTime += BUCKET_MS;
        index.push({
          time: lastBucketTime,
          kfIndex: keyframes.length - 1,
          eventIndex: i + 1, // first event strictly after bucket
        });
      }
    }
    return { keyframes, index, events: recordedEvents };
  }, [recordedEvents, initialStateRef]);

  // TODO: This is dogshit and needs to be cleaned up
  const seek = useCallback((targetTime: number): GlobalEditorState => {
    // Handle empty keyframes or events
    if (keyframes.length === 0) {
      const initialState = initialStateRef.current;
      const defaultState: GlobalEditorState = {
        files: new Map(),
        activeFile: {
          fileName: "main.js",
          content: initialState ?? EditorState.create(),
        },
        mouse: { x: 0, y: 0 },
      };
      return defaultState;
    }

    let bucket: IndexRow | undefined;
    if (index.length > 0 && targetTime >= index[0].time) {
      const rel = Math.floor((targetTime - index[0].time) / BUCKET_MS);
      const bucketIndex = Math.min(rel, index.length - 1);
      const cand = index[Math.max(0, bucketIndex)];
      if (cand && cand.time <= targetTime) {
        bucket = cand;
      }
    }

    let kfIndex = bucket?.kfIndex ?? upperBoundKF(keyframes, targetTime) - 1;
    kfIndex = Math.max(0, Math.min(kfIndex, keyframes.length - 1));
    let state = cloneState(keyframes[kfIndex].state);

    // find event start around eventIndex, then scan forward
    let i = bucket?.eventIndex ?? lowerBoundEvents(events, keyframes[kfIndex].time);
    for (; i < events.length && events[i].time! <= targetTime; i++) {
      state = reduce(state, events[i]);
    }
    return state;
  }, [index, keyframes, events, initialStateRef]);

  // This function only updates internal state, no UI changes
  // Only used for seeking
  function reduce(state: GlobalEditorState, event: RecordedEvent): GlobalEditorState {
    if (event.kind === "transaction" && event.transaction && event.transaction.changes) {
      // Determine which file this transaction applies to
      const targetFileName = event.fileName ?? state.activeFile.fileName;

      // Get current file state
      const currentFile = state.files.get(targetFileName) ?? state.activeFile;
      const currentEditorState = currentFile.content ?? EditorState.create();

      const changes = event.transaction.changes;
      let updatedEditorState: EditorState;
      try {
        updatedEditorState = currentEditorState.update({ changes }).state;
      }
      catch {
        const recordedText = event.transaction.state?.doc?.toString?.() ?? "";
        const replaceAll = { from: 0, to: currentEditorState.doc.length, insert: recordedText } as const;
        updatedEditorState = currentEditorState.update({ changes: replaceAll }).state;
      }

      const updatedFile: File = {
        fileName: targetFileName,
        content: updatedEditorState,
      };
      const newFiles = new Map<string, File>(state.files);
      newFiles.set(targetFileName, updatedFile);

      // Update activeFile if this was the active file
      const newActiveFile = targetFileName === state.activeFile.fileName
        ? updatedFile
        : state.activeFile;

      return {
        ...state,
        activeFile: newActiveFile,
        files: newFiles,
      };
    }
    if (event.kind === "file-switch" && event.fileName) {
      const existing = state.files.get(event.fileName) ?? {
        fileName: event.fileName,
        content: EditorState.create({ doc: "" }),
      };
      const newFiles = new Map<string, File>(state.files);
      newFiles.set(existing.fileName, existing);

      return {
        ...state,
        files: newFiles,
        activeFile: existing,
      };
    }

    if (event.kind === "file-create") {
      // File was created during recording (for informational purposes during playback)
      if (!event.fileName) {
        throw new Error("File name is missing for file-create event");
      }
      const newFileContent = EditorState.create({ doc: event.fileContent ?? "" });
      const newFileName = event.fileName;
      const newFile: File = {
        fileName: newFileName,
        content: newFileContent,
      };
      const newFilesMap = new Map<string, File>(state.files);
      newFilesMap.set(newFileName, newFile);
      return {
        ...state,
        files: newFilesMap,
      };
    }

    if (event.kind === "mouse" && event.mouse) {
      return {
        ...state,
        mouse: event.mouse,
      };
    }
    // Every event type should be handled above.
    // We throw this here so typescript shuts up.
    throw new Error(`Unknown event kind: ${event.kind}`);
  }

  const UpdateUIFromState = useCallback((state: GlobalEditorState) => {
    if (!editorApiRef.current) {
      return;
    }

    // Check if we need to switch files
    const currentActiveFile = filesManager.activeFile;
    if (state.activeFile.fileName !== currentActiveFile) {
      // Switch to the file from state
      const fileEntry = filesManager.files.get(state.activeFile.fileName);
      if (fileEntry) {
        filesManager.selectFile(state.activeFile.fileName);
      }
      else {
        const content = state.activeFile.content;
        filesManager.createFile(state.activeFile.fileName, content);
        filesManager.selectFile(state.activeFile.fileName);
      }
    }

    const currentFileContent = filesManager.files.get(state.activeFile.fileName)?.content ?? "";
    const newFileContent = state.activeFile.content;
    if (currentFileContent !== newFileContent) {
      filesManager.updateFileContent(state.activeFile.fileName, newFileContent);
    }

    // Update editor content
    const editorState = editorApiRef.current.getState();
    if (editorState) {
      editorApiRef.current.setState(state.activeFile.content);
    }

    // Update cursor position if mouse data is available
    if (state.mouse && cursorRef.current) {
      cursorRef.current.style.left = `${state.mouse.x}px`;
      cursorRef.current.style.top = `${state.mouse.y}px`;
      cursorRef.current.style.display = "block";
    }
  }, [cursorRef, editorApiRef, filesManager]);

  // for use in normal playback
  const applyEvent = useCallback((event: RecordedEvent) => {
    // Process current event
    if (event.kind === "transaction" && event.transaction && event.transaction.changes && editorApiRef.current) {
      const state = editorApiRef.current.getState();
      if (state) {
        const changes = event.transaction.changes;
        try {
          const update = state.update({ changes });
          editorApiRef.current.dispatch(update);
        }
        catch {
          const recordedText = event.transaction.state?.doc?.toString?.() ?? "";
          const replaceAll = { from: 0, to: state.doc.length, insert: recordedText } as const;
          const update = state.update({ changes: replaceAll });
          editorApiRef.current.dispatch(update);
        }

        // Apply selection range if recorded
        if (event.selection) {
          editorApiRef.current.setSelection(event.selection);
        }
      }
    }

    if (event.kind === "file-switch" && event.fileName && editorApiRef.current) {
      // Switch to the file during playback
      const targetFile = filesManager.files.get(event.fileName);
      if (targetFile) {
        const oldState = editorApiRef.current.getState();
        if (oldState) {
          filesManager.selectFile(event.fileName);
          editorApiRef.current.setState(targetFile.content);

          // Apply selection range if recorded
          if (event.selection) {
            editorApiRef.current.setSelection(event.selection);
          }
        }
      }
    }

    if (event.kind === "file-create") {
      // File was created during recording (for informational purposes during playback)
      const fileName = event.fileName ?? "";
      if (fileName) {
        filesManager.createFile(fileName, EditorState.create({ doc: event.fileContent ?? "" }));
      }
    }

    if (event.kind === "mouse" && event.mouse && cursorRef.current) {
      // Position cursor according to recorded coordinates (we store coords relative to editor rect)
      // Use left/top and keep the translate(-50%,-50%) so the dot centers on the point.
      cursorRef.current.style.left = `${event.mouse.x}px`;
      cursorRef.current.style.top = `${event.mouse.y}px`;
    }
  }, [cursorRef, editorApiRef, filesManager]);

  const animationLoop = useCallback(() => {
    if (!playingRef.current) {
      return;
    }
    const currentWallTime = performance.now();
    const currentPlaybackTime = (currentWallTime - startingWallTime.current) * rate + pausedAt.current;

    // Apply all the events up to the current playback time.
    // since eventPointer is stored outside the function
    // we only apply events that havent been done yet.
    while (eventPointer.current < recordedEvents.length && recordedEvents[eventPointer.current].time! <= currentPlaybackTime) {
      const event = recordedEvents[eventPointer.current];
      eventPointer.current++;
      applyEvent(event);
    }

    if (eventPointer.current >= recordedEvents.length) {
      // Reached the end of the recording
      // Hide cursor overlay when playback ends
      if (cursorRef.current) {
        cursorRef.current.style.display = "none";
      }
      playingRef.current = false;
      setIsPlaying(false);
      onPlaybackStateChange(false);
      return;
    }

    // Update playback time and schedule next frame
    setPlaybackTime(currentPlaybackTime);
    onPlaybackTimeChange(currentPlaybackTime);
    requestAnimationFrame(animationLoop);
  }, [applyEvent, onPlaybackStateChange, onPlaybackTimeChange, recordedEvents, rate, cursorRef]);

  /**
   * Starts playback of recorded events
   *
   * Sets up playback state and begins event loop.
   * Safe to call multiple times - will be no-op if already playing.
   */
  const play = useCallback(async () => {
    if (isLoadingRecording) {
      return;
    }

    if (!isPlaying) {
      playingRef.current = true;
      setIsPlaying(true);
      onPlaybackStateChange(true);
      if (!editorApiRef.current) {
        return;
      }
      if (!recordedEvents || recordedEvents.length === 0) {
        return;
      }

      // Reset editor to initial state
      if (initialStateRef.current && playbackTime === 0) {
        const state = editorApiRef.current.getState();

        if (state) {
          editorApiRef.current.setState(initialStateRef.current);
        }
      }

      // Show cursor overlay
      if (cursorRef.current) {
        cursorRef.current.style.display = "block";
      }
      startingWallTime.current = performance.now();
      requestAnimationFrame(animationLoop);
    }
  }, [isLoadingRecording, isPlaying, onPlaybackStateChange, recordedEvents, editorApiRef, initialStateRef, cursorRef, startingWallTime, animationLoop, playbackTime]);

  /**
   * Pauses current playback
   *
   * Stops event processing and cleans up timers.
   * Can resume later by calling play() again.
   */
  const pause = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    onPlaybackStateChange(false);
    const mediaNow = (performance.now() - startingWallTime.current) * rate + pausedAt.current;
    pausedAt.current = mediaNow;
  }, [onPlaybackStateChange]);

  /**
   * Seeks to a specific time in the recording
   *
   * Pauses playback if currently playing, then computes the state at the target time
   * and updates the UI accordingly. Also updates the event pointer so playback
   * can continue from the seeked position.
   */
  const handleSeek = useCallback((targetTime: number) => {
    // Clamp target time to valid range
    if (recordedEvents.length === 0) {
      return;
    }
    const minTime = recordedEvents[0]?.time ?? 0;
    const maxTime = Math.max(...recordedEvents.map(event => event.time ?? 0));
    const clampedTime = Math.max(minTime, Math.min(targetTime, maxTime));

    // Pause playback if currently playing
    if (playingRef.current) {
      pause();
    }

    // Compute state at target time
    const state = seek(clampedTime);

    // Update event pointer to the first event after the seek time
    eventPointer.current = lowerBoundEvents(events, clampedTime);

    // Update pausedAt to the seek time so playback can continue from here
    pausedAt.current = clampedTime;

    // Update UI from computed state
    UpdateUIFromState(state);

    // Update playback time
    setPlaybackTime(clampedTime);
    onPlaybackTimeChange(clampedTime);
  }, [recordedEvents, events, onPlaybackTimeChange, UpdateUIFromState, seek, pause]);

  return {
    play,
    pause,
    seek: handleSeek,
    isPlaying,
    playbackTime,
  };
}
