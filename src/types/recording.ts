import type { SerializedRecordedEvent } from "~/lib/coding-session/events";
import type { ProblemDefinition } from "~/types/coding-session";

/**
 * Complete recording data structure for storage
 *
 * Note: the `files` field maps filenames to their content (filename -> content)
 */
export type RecordingData = {
  id: string;
  title: string;
  problem: ProblemDefinition;
  initialCode: string;
  files: Record<string, string>;
  activeFile: string;
  events: SerializedRecordedEvent[];
  metadata: {
    createdAt: string;
    duration: number;
    instructorId?: string;
  };
};
