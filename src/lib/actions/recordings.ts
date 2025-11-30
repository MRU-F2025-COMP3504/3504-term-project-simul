"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { RecordingData } from "~/types/recording";

import { db } from "~/lib/db";
import { recording } from "~/lib/db/schema";
import { createRecordingData } from "~/lib/recording-utils";
import { actionClient } from "~/lib/safe-action";

const saveRecordingSchema = z.object({
  title: z.string(),
  problem: z.any(), // TODO: #119
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
 * @returns The saved recording ID
 */
export const saveRecordingAction = actionClient
  .inputSchema(saveRecordingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const recordingData = createRecordingData(parsedInput);

      const [savedRecording] = await db.insert(recording).values({
        title: recordingData.title,
        problem: recordingData.problem,
        initialCode: recordingData.initialCode,
        files: recordingData.files,
        activeFile: recordingData.activeFile,
        events: recordingData.events,
        duration: recordingData.metadata.duration,
        instructorId: recordingData.metadata.instructorId || null,
        // createdAt will use default (now())
      }).returning();

      if (!savedRecording) {
        throw new Error("Failed to save recording to database");
      }

      return { recordingId: savedRecording.id };
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
      const [result] = await db
        .select()
        .from(recording)
        .where(eq(recording.id, parsedInput.id));

      if (!result) {
        throw new Error(`Recording with ID ${parsedInput.id} not found`);
      }

      const recordingData: RecordingData = {
        id: result.id,
        title: result.title,
        problem: result.problem as any,
        initialCode: result.initialCode,
        files: result.files as Record<string, { name: string; content: string }>,
        activeFile: result.activeFile,
        events: result.events as any[],
        metadata: {
          createdAt: result.createdAt?.toISOString() ?? new Date().toISOString(),
          duration: result.duration,
          instructorId: result.instructorId || undefined,
        },
      };

      return { recording: recordingData };
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
    const results = await db
      .select({
        id: recording.id,
        title: recording.title,
        problemTitle: recording.problem,
        createdAt: recording.createdAt,
        duration: recording.duration,
      })
      .from(recording)
      .orderBy(desc(recording.createdAt)); // TODO: pagination, filtering, etc. Realistically a subissue of #119, as I assume instructors can order their courses.

    const recordings = results.map((r) => {
      const problem = r.problemTitle as any;
      return {
        id: r.id,
        title: r.title,
        problemTitle: problem?.title || "Unknown Problem",
        createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
        duration: r.duration,
      };
    });

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
      await db
        .delete(recording)
        .where(eq(recording.id, parsedInput.id));

      return {};
    }
    catch (error) {
      console.error("Failed to delete recording:", error);
      throw new Error("Failed to delete recording");
    }
  });

/**
 * Get recording by ID for playback (student-safe, read-only)
 *
 * @param params - Recording ID
 * @returns Recording data for playback
 */
export const getRecordingForPlaybackAction = actionClient
  .inputSchema(loadRecordingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [result] = await db
        .select()
        .from(recording)
        .where(eq(recording.id, parsedInput.id));

      if (!result) {
        throw new Error(`Recording with ID ${parsedInput.id} not found`);
      }

      const recordingData: RecordingData = {
        id: result.id,
        title: result.title,
        problem: result.problem as any,
        initialCode: result.initialCode,
        files: result.files as Record<string, { name: string; content: string }>,
        activeFile: result.activeFile,
        events: result.events as any[],
        metadata: {
          createdAt: result.createdAt?.toISOString() ?? new Date().toISOString(),
          duration: result.duration,
          instructorId: result.instructorId || undefined,
        },
      };

      return { recording: recordingData };
    }
    catch (error) {
      console.error("Failed to load recording for playback:", error);
      throw new Error("Failed to load recording for playback");
    }
  });
