/**
 * usePlayer Hook - Playback Engine for Recorded Coding Sessions
 *
 * Manages the playback of recorded events (edits, file operations, mouse movements).
 * Handles timeline progression, editor state restoration, and cursor position updates.
 *
 * Responsibilities:
 * - Replays CodeMirror transactions, file switches, file creations, and cursor updates in order.
 * - Maintains keyframe snapshots and time buckets so seeks resolve quickly without replaying
 *   the entire history.
 * - Keeps UI state in sync with the reconstructed snapshot via the shared FilesManager and
 *   cursor overlay refs.
 *
 * Performance Notes:
 * - Uses refs for high-frequency updates (playback clock, cursor position, event pointer).
 * - Uses `requestAnimationFrame` for the playback loop so updates happen when the browser rerenders.
 * - Prefers recorded document snapshots when present, falling back to ChangeSets to avoid
 *   expensive re-computation.
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
 *   isLoadingRecording,
 * });
 *
 * await player.play();
 * player.pause();
 * player.seek(2_000); // jump to 2s mark
 * ```
 */

import { EditorState } from "@codemirror/state";
import { useCallback, useMemo, useRef, useState } from "react";

import type { EditorAPI, File, GlobalEditorState, IndexRow, KeyFrame, RecordedEvent } from "~/types/coding-session";

import { cloneState, getNextEventIndex, upperBoundKF } from "~/lib/coding-session/playback";

import type { FilesManager } from "./use-files-manager";

import { useAudioPlayback } from "./use-audio-playback";
import { useEditorController } from "./use-editor-controller";

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
  /** Whether recording is currently active (prevents audio playback during recording) */
  recording?: boolean;
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
  recording,
}: UsePlayerProps): PlayerHandle {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playingRef = useRef(false);
  const startingWallTime = useRef(0);
  const pausedAt = useRef(0);
  const rate = 1;
  const eventPointer = useRef(0);
  const editorController = useEditorController(editorApiRef);

  // Audio playback integration
  const _audioPlayback = useAudioPlayback({
    events: recordedEvents,
    isPlaying,
    currentTime: playbackTime,
    recording: recording ?? false,
  });

  /**
   * This memo computes keyframes, index, and events for playback.
   * These variables are then able to be used by the other functions in this hook.
   */
  const { keyframes, index, events } = useMemo(() => {
    const initialState = initialStateRef.current;

    if (!initialState && recordedEvents.length > 0) {
      console.error(
        "Building keyframes with incomplete initial state. "
        + "Something has gone wrong while loading the recording.",
      );
    }

    // We always use main.js as the initial file.
    const activeFile = {
      fileName: "main.js",
      content: initialState ?? EditorState.create(),
    };

    let state: GlobalEditorState = {
      files: new Map([[activeFile.fileName, activeFile]]),
      activeFile,
      mouse: { x: 0, y: 0 },
    };
    // Create keyframes array with initial state snapshot
    const keyframes: KeyFrame[] = [{
      time: recordedEvents[0]?.time ?? 0,
      state: cloneState(state),
      eventIndex: 0,
    }];

    const index: IndexRow[] = [];
    // Every N events, create a keyframe snapshot
    // We choose 10, have not tested to see if other numbers feel better
    const KF_EVERY_N = 10;

    let lastBucketTime = keyframes[0].time;
    for (let i = 0; i < recordedEvents.length; i++) {
      const event = recordedEvents[i];
      // Apply event to current state and return the derived state.
      state = reduce(state, event);
      // keyframe every N events
      const nextEventIndex = i + 1;

      if ((i + 1) % KF_EVERY_N === 0) {
        keyframes.push({
          time: event.time ?? keyframes[keyframes.length - 1].time,
          state: cloneState(state),
          eventIndex: nextEventIndex,
        });
      }
      // time bucket index for fast seeks
      const eventTime = event.time ?? lastBucketTime;
      while (lastBucketTime + BUCKET_MS <= eventTime) {
        // increment lastBucketTime by bucket size
        // Now that it's incremented, we use it to determine the active keyframe
        lastBucketTime += BUCKET_MS;
        // Get the keyframe active at this time
        const activeKeyframeIndex = Math.max(0, upperBoundKF(keyframes, lastBucketTime) - 1);
        index.push({
          time: lastBucketTime,
          kfIndex: activeKeyframeIndex,
          eventIndex: keyframes[activeKeyframeIndex]?.eventIndex ?? 0,
        });
      }
    }
    return { keyframes, index, events: recordedEvents };
  }, [recordedEvents, initialStateRef]);

  /**
   * Produces the editor state at the playback timestamp.
   *
   * @param targetTime - Playback time in milliseconds of the desired state.
   * @returns Global editor state that mirrors the recording at the given time.
   */
  const seek = useCallback((targetTime: number): GlobalEditorState => {
    // Use the time bucket index to get close to the target time without scanning every event
    let matchingBucket: IndexRow | undefined;
    if (index.length > 0 && targetTime >= index[0].time) {
      // Determine how many buckets away the target time is from the first indexed bucket
      const relativeBucketOffset = Math.floor((targetTime - index[0].time) / BUCKET_MS);
      const clampedBucketIndex = Math.min(relativeBucketOffset, index.length - 1);
      const candidateBucket = index[Math.max(0, clampedBucketIndex)];
      // Only use the bucket if its timestamp does not overshoot the requested time
      if (candidateBucket && candidateBucket.time <= targetTime) {
        matchingBucket = candidateBucket;
      }
    }

    // If a bucket was found, use its keyframe, otherwise use binary search to get one.
    let kfIndex = matchingBucket?.kfIndex ?? upperBoundKF(keyframes, targetTime) - 1;
    kfIndex = Math.max(0, Math.min(kfIndex, keyframes.length - 1));
    const baseKeyframe = keyframes[kfIndex];
    let state = cloneState(baseKeyframe.state);

    // Check if bucket event pointer or keyframe event pointer is later, start from there.
    const startingIndexFromKF = baseKeyframe.eventIndex ?? 0;
    const startingIndexFromBucket = matchingBucket?.eventIndex ?? startingIndexFromKF;
    let i = Math.max(startingIndexFromKF, startingIndexFromBucket);
    // Apply events until targetTime
    for (; i < events.length && (events[i].time ?? Number.POSITIVE_INFINITY) <= targetTime; i++) {
      state = reduce(state, events[i]);
    }
    return state;
  }, [index, keyframes, events]);

  /**
   * Applies a recorded event to an in-memory snapshot without updating the UI.
   *
   * @param state - The baseline state to mutate.
   * @param event - Event to apply to the snapshot.
   * @returns Updated snapshot with the event incorporated.
   *
   * Notes:
   * - This function only updates internal state, no UI changes.
   * - Only used for seeking.
   */
  function reduce(state: GlobalEditorState, event: RecordedEvent): GlobalEditorState {
    // Rehydrate document state by applying the recorded transaction
    if (event.kind === "transaction") {
      // Determine which file this transaction applies to
      const targetFileName = event.fileName ?? state.activeFile.fileName;

      // Get current file state
      const fallbackFile = state.files.get(targetFileName);
      const currentFile: File = fallbackFile ?? {
        fileName: targetFileName,
        content: state.activeFile.fileName === targetFileName ? state.activeFile.content : EditorState.create(),
      };
      const currentEditorState = currentFile.content ?? EditorState.create();

      let updatedEditorState: EditorState;
      try {
        updatedEditorState = currentEditorState.update(event.transaction!).state;
      }
      catch (err) {
        console.error("Error applying transaction during reduce:", err);
        throw err;
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

    if (event.kind === "audio-chunk") {
      // Audio chunks are handled separately by the audio playback system
      // No state changes needed for the editor state
      return state;
    }

    // Every event type should be handled above.
    throw new Error(`Unknown event kind: ${event.kind}`);
  }

  /**
   * Synchronises the live FilesManager and cursor overlay with a reconstructed snapshot.
   *
   * @param state - Snapshot to project into the UI.
   */
  const UpdateUIFromState = useCallback((state: GlobalEditorState) => {
    // Replace filesManager state with the computed playback snapshot to avoid stale content
    const snapshot = new Map<string, File>();
    state.files.forEach((file, name) => {
      snapshot.set(name, {
        fileName: file.fileName,
        content: file.content,
      });
    });

    filesManager.loadFiles(snapshot, state.activeFile.fileName);

    // loadFiles already sets the editor content; ensure cursor overlay matches
    if (state.mouse && cursorRef.current) {
      cursorRef.current.style.left = `${state.mouse.x}px`;
      cursorRef.current.style.top = `${state.mouse.y}px`;
      cursorRef.current.style.display = "block";
    }
  }, [cursorRef, filesManager]);

  /**
   * Restores playback back to the first frame and refreshes shared state accordingly.
   */
  const resetToBeginning = useCallback(() => {
    // Reset state so the next playback starts from the first frame
    const baselineState = seek(0);
    eventPointer.current = getNextEventIndex(0, events);
    pausedAt.current = 0;
    setPlaybackTime(0);
    onPlaybackTimeChange(0);
    UpdateUIFromState(baselineState);
  }, [UpdateUIFromState, onPlaybackTimeChange, seek, events]);

  /**
   * Applies a single recorded event to the live editor and FilesManager instances.
   *
   * @param event - Event to replay.
   *
   * Notes:
   */
  const applyEvent = useCallback((event: RecordedEvent) => {
    // Process current event
    if (event.kind === "transaction" && event.transaction) {
      editorController.applyTransaction(event.transaction);
    }

    if (event.kind === "file-switch" && event.fileName) {
      // Switch to the file during playback
      const targetFile = filesManager.files.get(event.fileName);
      if (targetFile) {
        const oldState = editorController.getEditorState();
        if (oldState) {
          filesManager.selectFile(event.fileName, { skipEditorUpdate: false });
        }
      }
    }

    if (event.kind === "file-create") {
      // File was created during recording (for informational purposes during playback)
      const fileName = event.fileName ?? "";
      if (fileName && event.fileContent !== undefined) {
        filesManager.createFile(fileName, EditorState.create({ doc: event.fileContent }), false);
      }
    }

    if (event.kind === "mouse" && event.mouse && cursorRef.current) {
      // Position cursor according to recorded coordinates (we store coords relative to editor rect)
      // Use left/top and keep the translate(-50%,-50%) so the dot centers on the point.
      cursorRef.current.style.left = `${event.mouse.x}px`;
      cursorRef.current.style.top = `${event.mouse.y}px`;
    }
  }, [cursorRef, filesManager, editorController]);

  /**
   * Runs the frame-by-frame playback loop, applying events whose timestamps are in range.
   */
  const animationLoop = useCallback(() => {
    if (!playingRef.current) {
      return;
    }
    // Convert wall-clock time to playback time, taking pauses into account
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
      if (recordedEvents.length > 0) {
        // Use non-audio events to determine end time to avoid timestamp issues
        const nonAudioEvents = recordedEvents.filter(e => e.kind !== "audio-chunk");
        const endTime = nonAudioEvents.length > 0
          ? Math.max(...nonAudioEvents.map(e => e.time))
          : pausedAt.current;
        pausedAt.current = endTime;
        setPlaybackTime(endTime);
        onPlaybackTimeChange(endTime);
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
   * Starts playback of recorded events and starts the animation loop.
   *
   * @returns Promise that resolves once playback scheduling finishes.
   */
  const play = useCallback(async () => {
    if (isLoadingRecording || isPlaying) {
      return;
    }

    if (!recordedEvents || recordedEvents.length === 0) {
      return;
    }

    if (eventPointer.current >= recordedEvents.length) {
      resetToBeginning();
    }

    playingRef.current = true;
    setIsPlaying(true);
    onPlaybackStateChange(true);

    // Reset editor to initial state
    if (initialStateRef.current && playbackTime === 0) {
      const state = editorController.getEditorState();

      if (state) {
        editorController.setEditorState(initialStateRef.current);
      }
    }

    // Show cursor overlay
    if (cursorRef.current) {
      cursorRef.current.style.display = "block";
    }
    startingWallTime.current = performance.now();
    requestAnimationFrame(animationLoop);
  }, [animationLoop, cursorRef, initialStateRef, isLoadingRecording, isPlaying, onPlaybackStateChange, playbackTime, recordedEvents, resetToBeginning, startingWallTime, editorController]);

  /**
   * Pauses the playback loop and saves the current media clock.
   */
  const pause = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    onPlaybackStateChange(false);
    const mediaNow = (performance.now() - startingWallTime.current) * rate + pausedAt.current;
    pausedAt.current = mediaNow;
  }, [onPlaybackStateChange]);

  /**
   * Seeks to a specific time in the recording and updates the UI with that state.
   *
   * @param targetTime - Desired playback time in milliseconds.
   */
  const handleSeek = useCallback((targetTime: number) => {
    if (recordedEvents.length === 0) {
      return;
    }
    // Clamp target time to valid range - only use non-audio events to avoid timestamp issues
    const nonAudioEvents = recordedEvents.filter(event => event.kind !== "audio-chunk");
    const minTime = nonAudioEvents[0]?.time ?? 0;
    const maxTime = Math.max(...nonAudioEvents.map(event => event.time ?? 0));
    const clampedTime = Math.max(minTime, Math.min(targetTime, maxTime));

    // Pause playback if currently playing
    if (playingRef.current) {
      pause();
    }

    // Compute state at target time
    const state = seek(clampedTime);

    // Update event pointer to the first event after the seek time
    eventPointer.current = getNextEventIndex(clampedTime, events);

    // Update pausedAt to the seek time so playback can continue from here
    pausedAt.current = clampedTime;

    // Update UI from computed state (this handles all editor state updates)
    UpdateUIFromState(state);

    // Update playback time
    setPlaybackTime(clampedTime);
    onPlaybackTimeChange(clampedTime);
  }, [recordedEvents, onPlaybackTimeChange, UpdateUIFromState, seek, pause, events]);

  return {
    play,
    pause,
    seek: handleSeek,
    isPlaying,
    playbackTime,
  };
}
