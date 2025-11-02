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

import type { EditorState } from "@codemirror/state";

import { useCallback, useRef, useState } from "react";

import type { EditorAPI, RecordedEvent } from "~/types/coding-session";

/**
 * API returned by usePlayer hook
 */
export type PlayerHandle = {
  /** Start playback of recorded events */
  play: () => Promise<void>;
  /** Pause current playback */
  pause: () => void;
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
  filesManager: {
    files: Map<string, { name: string; content: string }>;
    activeFile: string;
    createFile: (fileName: string, content?: string) => void;
    selectFile: (name: string) => void;
    updateFileContent: (name: string, content: string) => void;
    deleteFile: (name: string) => void;
  };
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
}: UsePlayerProps): PlayerHandle {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playingRef = useRef(false);
  const startingWallTime = useRef(0);
  const pausedAt = useRef(0);
  const rate = 1;
  const eventPointer = useRef(0);
  function applyEvent(event: RecordedEvent) {
    // Process current event
    if (event.kind === "transaction" && event.transaction && event.transaction.changes && editorApiRef.current) {
      const state = editorApiRef.current.getState();
      if (state) {
        const changes = event.transaction.changes;
        const update = state.update({ changes });
        editorApiRef.current.dispatch(update);

        // Apply selection range if recorded
        if (event.selection) {
          editorApiRef.current.setSelection(event.selection);
        }
      }
    }

    if (event.kind === "file-switch" && event.fileName && editorApiRef.current) {
      // Switch to the file during playback
      const fileEntry = filesManager.files.get(event.fileName);
      if (fileEntry) {
        const state = editorApiRef.current.getState();
        if (state) {
          const update = state.update({
            changes: {
              from: 0,
              to: state.doc.length,
              insert: fileEntry.content,
            },
          });
          editorApiRef.current.dispatch(update);
        }
      }
    }

    if (event.kind === "file-create") {
      // File was created during recording (for informational purposes during playback)
      const fileName = event.fileName ?? "";
      if (fileName) {
        filesManager.createFile(fileName, event.fileContent ?? "");
      }
    }

    if (event.kind === "mouse" && event.mouse && cursorRef.current) {
      // Position cursor according to recorded coordinates (we store coords relative to editor rect)
      // Use left/top and keep the translate(-50%,-50%) so the dot centers on the point.
      cursorRef.current.style.left = `${event.mouse.x}px`;
      cursorRef.current.style.top = `${event.mouse.y}px`;
    }
  }

  function animationLoop() {
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
      playingRef.current = false;
      setIsPlaying(false);
      onPlaybackStateChange(false);
      return;
    }

    // Update playback time and schedule next frame
    setPlaybackTime(currentPlaybackTime);
    onPlaybackTimeChange(currentPlaybackTime);
    requestAnimationFrame(animationLoop);
  }
  /**
   * Main playback loop
   *
   * Processes recorded events in chronological order:
   * 1. Restores initial editor state
   * 2. Shows cursor overlay
   * 3. Iterates through events, applying delays between them
   * 4. For each event:
   *    - Transaction: applies code changes to editor
   *    - File-switch: switches active file
   *    - File-create: creates new file (for completeness during replay)
   *    - Mouse: updates cursor position on screen
   * 5. Hides cursor when playback ends
   */
  const handlePlayback = useCallback(async () => {
    if (!editorApiRef.current) {
      return;
    }
    if (!recordedEvents || recordedEvents.length === 0) {
      return;
    }

    // TODO: What is our inital state? The output of FileManager.resetToStarter?
    // I guess a recording can start after some edits to the code have been made
    // So it won't always be resetToStarter.
    // Reset editor to initial state
    if (initialStateRef.current) {
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

    // Hide cursor overlay when playback ends
    if (cursorRef.current) {
      cursorRef.current.style.display = "none";
    }
  }, [recordedEvents, editorApiRef, initialStateRef, cursorRef, onPlaybackStateChange, startingWallTime]);

  /**
   * Starts playback of recorded events
   *
   * Sets up playback state and begins event loop.
   * Safe to call multiple times - will be no-op if already playing.
   */
  const play = useCallback(async () => {
    if (!isPlaying) {
      playingRef.current = true;
      setIsPlaying(true);
      onPlaybackStateChange(true);
      await handlePlayback();
    }
  }, [isPlaying, handlePlayback, onPlaybackStateChange]);

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

  return {
    play,
    pause,
    isPlaying,
    playbackTime,
  };
}
