"use server";

import { z } from "zod";

import { createRecordingData } from "~/lib/recording-utils";
import { actionClient } from "~/lib/safe-action";
import { RecordingStorage } from "~/lib/storage/recording-storage";

const saveRecordingSchema = z.object({
  title: z.string(),
  problem: z.any(),
  recordedEvents: z.array(z.any()), // already serialized events
  initialCode: z.string(),
  files: z.record(z.string(), z.object({ name: z.string(), content: z.string() })),
  activeFile: z.string(),
  instructorId: z.string().optional(),
});

const loadRecordingSchema = z.object({
  id: z.string(),
});

/**
 * Save a coding session recording
 *
 * @param params - Recording data parameters
 * @returns The saved recording ID and file path
 */
export const saveRecordingAction = actionClient
  .inputSchema(saveRecordingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const recordingData = createRecordingData(parsedInput);
      const filePath = await RecordingStorage.save(recordingData);
      return { recordingId: recordingData.id, filePath };
    }
    catch (error) {
      console.error("Failed to save recording:", error);
      throw new Error("Failed to save recording");
    }
  });

/**
 * Load a recording by ID
 *
 * @param params - Recording ID
 * @returns The loaded recording data
 */
export const loadRecordingAction = actionClient
  .inputSchema(loadRecordingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const recording = await RecordingStorage.load(parsedInput.id);
      return { recording };
    }
    catch (error) {
      console.error("Failed to load recording:", error);
      throw new Error("Failed to load recording");
    }
  });

/**
 * List all recordings
 *
 * @returns Array of recording metadata
 */
export const listRecordingsAction = actionClient.action(async () => {
  try {
    const recordings = await RecordingStorage.list();
    return { recordings };
  }
  catch (error) {
    console.error("Failed to list recordings:", error);
    throw new Error("Failed to list recordings");
  }
});

/**
 * Delete a recording
 *
 * @param params - Recording ID
 */
export const deleteRecordingAction = actionClient
  .inputSchema(loadRecordingSchema)
  .action(async ({ parsedInput }) => {
    try {
      await RecordingStorage.delete(parsedInput.id);
      return {};
    }
    catch (error) {
      console.error("Failed to delete recording:", error);
      throw new Error("Failed to delete recording");
    }
  });
