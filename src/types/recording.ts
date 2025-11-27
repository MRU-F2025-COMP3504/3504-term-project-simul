import type { EditorState as CMEditorState } from "@codemirror/state";

import type { FilesManager } from "~/hooks/coding-session/use-files-manager";
import type { SerializedRecordedEvent } from "~/lib/coding-session/events";
import type { ProblemDefinition, RecordedEvent } from "~/types/coding-session";

/**
 * Status of a save recording operation
 */
export enum SaveStatus {
  Idle = "idle",
  Saving = "saving",
  Saved = "saved",
  Error = "error",
}

/**
 * Options for saving a recording
 */
export type SaveRecordingOptions = {
  recordedEvents: RecordedEvent[];
  filesManager: FilesManager;
  initialStateRef: React.RefObject<CMEditorState | null>;
  problem: ProblemDefinition;
};

/**
 * Complete recording data structure for storage
 *
 * Note: the `files` field maps filenames to file objects with name and content
 * (filename -> { name: string; content: string })
 */
export type RecordingData = {
  id: string;
  title: string;
  problem: ProblemDefinition;
  initialCode: string;
  files: Record<string, { name: string; content: string }>;
  activeFile: string;
  events: SerializedRecordedEvent[];
  metadata: {
    createdAt: string;
    duration: number;
    instructorId?: string;
  };
};

/**
 * Recording summary type
 *
 * This type represents a summary of a recording, including its ID, title,
 * duration, and creation date.
 */
export type Recording = {
  id: string;
  title: string;
  duration?: number | null;
  createdAt: Date;
};
