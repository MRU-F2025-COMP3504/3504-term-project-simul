"use client";

import type { EditorState as CMEditorState } from "@codemirror/state";
import type { ReactNode } from "react";

import { createContext, use, useMemo, useRef, useState } from "react";

import type { EditorAPI, RecordedEvent } from "~/types/coding-session";

/**
 * Shared state for the instructor coding session.
 *
 * This context holds the grossest bits of shared state that was being
 * prop-drilled everywhere:
 * - Editor refs (used by recorder, player, files manager)
 * - Recorded events array (used by player, toolbar, playback controls)
 * - Playback state (time and isPlaying)
 */
type InstructorSessionContextValue = {
  // Editor refs - shared between recorder, player, files manager
  editorApiRef: React.RefObject<EditorAPI | null>;
  cursorRef: React.RefObject<HTMLDivElement | null>;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;

  // Recording state - shared between player, toolbar, playback controls
  recordedEvents: RecordedEvent[];
  setRecordedEvents: React.Dispatch<React.SetStateAction<RecordedEvent[]>>;

  // Playback state - shared between player, toolbar, playback controls
  playbackTime: number;
  setPlaybackTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;

  // Initial state ref - used by player for playback reset
  initialStateRef: React.RefObject<CMEditorState | null>;

  // Loading state
  isLoadingRecording: boolean;
  setIsLoadingRecording: React.Dispatch<React.SetStateAction<boolean>>;
};

const InstructorSessionContext = createContext<InstructorSessionContextValue | null>(null);

export function InstructorSessionProvider({ children }: { children: ReactNode }) {
  const editorApiRef = useRef<EditorAPI | null>(null);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const initialStateRef = useRef<CMEditorState | null>(null);

  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingRecording, setIsLoadingRecording] = useState(false);

  const value = useMemo(
    () => ({
      editorApiRef,
      cursorRef,
      editorContainerRef,
      recordedEvents,
      setRecordedEvents,
      playbackTime,
      setPlaybackTime,
      isPlaying,
      setIsPlaying,
      initialStateRef,
      isLoadingRecording,
      setIsLoadingRecording,
    }),
    [recordedEvents, playbackTime, isPlaying, isLoadingRecording],
  );

  return <InstructorSessionContext value={value}>{children}</InstructorSessionContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInstructorSession() {
  const context = use(InstructorSessionContext);
  if (!context) {
    throw new Error("useInstructorSession must be used within InstructorSessionProvider");
  }
  return context;
}
