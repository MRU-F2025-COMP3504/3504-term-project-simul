import type { SerializedRecordedEvent } from "~/lib/coding-session/events";
import type { ProblemDefinition } from "~/types/coding-session";
import type { RecordingData } from "~/types/recording";

import { totalDuration } from "~/lib/coding-session/events";

export type CreateRecordingDataParams = {
  title: string;
  problem: ProblemDefinition;
  recordedEvents: SerializedRecordedEvent[];
  initialCode: string;
  files: Record<string, { name: string; content: string }>;
  activeFile: string;
  instructorId?: string;
};

/**
 * Create a RecordingData object from current instructor state
 *
 * This function takes the current state from the instructor component
 * and converts it to a serializable RecordingData structure.
 *
 * @param params - Current state from the instructor component
 */
export function createRecordingData(params: CreateRecordingDataParams): RecordingData {
  const { title, problem, recordedEvents, initialCode, files, activeFile, instructorId } = params;

  const filesObject: Record<string, string> = {};
  for (const [fileName, fileData] of Object.entries(files)) {
    filesObject[fileName] = fileData.content;
  }

  const duration = totalDuration(recordedEvents);

  return {
    id: "", // set by RecordingStorage.save()
    title,
    problem,
    initialCode,
    files: filesObject,
    activeFile,
    events: recordedEvents,
    metadata: {
      createdAt: new Date().toISOString(),
      duration,
      instructorId,
    },
  };
}
