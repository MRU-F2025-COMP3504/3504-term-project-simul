"use server";

import { and, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import type { Lesson } from "~/types/course";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { course, lesson } from "~/lib/db/schema";
import { actionClient } from "~/lib/safe-action";

const createLessonSchema = z.object({
  courseId: z.uuid("Invalid course ID"),
  title: z.string().min(1).max(100, "Title must be 1-100 characters"),
  orderIndex: z.number().int().positive("Order index must be a positive integer").optional(),
  recordingId: z.uuid("Invalid recording ID").optional().nullable(),
});

const updateLessonSchema = z.object({
  id: z.uuid("Invalid lesson ID"),
  courseId: z.uuid("Invalid course ID"),
  title: z.string().min(1).max(100).optional(),
  orderIndex: z.number().int().positive().optional(),
  recordingId: z.uuid("Invalid recording ID").optional().nullable(),
});

const deleteLessonSchema = z.object({
  id: z.uuid("Invalid lesson ID"),
  courseId: z.uuid("Invalid course ID"),
});

const reorderLessonsSchema = z.object({
  courseId: z.uuid("Invalid course ID"),
  lessons: z.array(
    z.object({
      id: z.uuid("Invalid lesson ID"),
      orderIndex: z.number().int().positive("Order index must be positive"),
    }),
  ),
});

const linkRecordingSchema = z.object({
  lessonId: z.uuid("Invalid lesson ID"),
  recordingId: z.uuid("Invalid recording ID"),
});

/**
 * Create a new lesson in a course
 *
 * @param input - Lesson creation data
 * @returns Created lesson object
 */
export const createLessonAction = actionClient
  .inputSchema(createLessonSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // verify user owns the course
      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.courseId));

      if (!courseData) {
        throw new Error("Course not found");
      }

      if (courseData.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      let orderIndex = parsedInput.orderIndex;
      if (orderIndex === undefined) {
        const maxLesson = await db
          .select({ maxOrder: lesson.orderIndex })
          .from(lesson)
          .where(eq(lesson.courseId, parsedInput.courseId))
          .orderBy(lesson.orderIndex);

        orderIndex = (maxLesson[0]?.maxOrder ?? 0) + 1;
      }

      if (parsedInput.orderIndex !== undefined) {
        const lessonsToShift = await db
          .select()
          .from(lesson)
          .where(
            and(
              eq(lesson.courseId, parsedInput.courseId),
              gte(lesson.orderIndex, parsedInput.orderIndex),
            ),
          );

        for (const lessonToShift of lessonsToShift) {
          await db
            .update(lesson)
            .set({ orderIndex: lessonToShift.orderIndex + 1 })
            .where(eq(lesson.id, lessonToShift.id));
        }
      }

      const [newLesson] = await db
        .insert(lesson)
        .values({
          courseId: parsedInput.courseId,
          title: parsedInput.title,
          orderIndex,
          recordingId: parsedInput.recordingId || null,
        })
        .returning();

      if (!newLesson) {
        throw new Error("Failed to create lesson");
      }

      const result: Lesson = {
        id: newLesson.id,
        title: newLesson.title,
        orderIndex: newLesson.orderIndex,
        courseId: newLesson.courseId,
        recordingId: newLesson.recordingId,
        createdAt: newLesson.createdAt,
      };

      return { lesson: result };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create lesson";
      console.error("Error creating lesson:", error);
      throw new Error(message);
    }
  });

/**
 * Update a lesson
 *
 * @param input - Lesson ID and updated fields
 * @returns Updated lesson object
 */
export const updateLessonAction = actionClient
  .inputSchema(updateLessonSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // verify user owns the course
      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.courseId));

      if (!courseData) {
        throw new Error("Course not found");
      }

      if (courseData.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      const [existingLesson] = await db
        .select()
        .from(lesson)
        .where(
          and(
            eq(lesson.id, parsedInput.id),
            eq(lesson.courseId, parsedInput.courseId),
          ),
        );

      if (!existingLesson) {
        throw new Error("Lesson not found");
      }

      // build update object with only provided fields
      const updateData: Record<string, unknown> = {};
      if (parsedInput.title !== undefined)
        updateData.title = parsedInput.title;
      if (parsedInput.orderIndex !== undefined)
        updateData.orderIndex = parsedInput.orderIndex;
      if (parsedInput.recordingId !== undefined)
        updateData.recordingId = parsedInput.recordingId || null;

      if (Object.keys(updateData).length === 0) {
        // no updates provided, return existing lesson
        const result: Lesson = {
          id: existingLesson.id,
          title: existingLesson.title,
          orderIndex: existingLesson.orderIndex,
          courseId: existingLesson.courseId,
          recordingId: existingLesson.recordingId,
          createdAt: existingLesson.createdAt,
        };
        return { lesson: result };
      }

      const [updatedLesson] = await db
        .update(lesson)
        .set(updateData)
        .where(eq(lesson.id, parsedInput.id))
        .returning();

      if (!updatedLesson) {
        throw new Error("Failed to update lesson");
      }

      const result: Lesson = {
        id: updatedLesson.id,
        title: updatedLesson.title,
        orderIndex: updatedLesson.orderIndex,
        courseId: updatedLesson.courseId,
        recordingId: updatedLesson.recordingId,
        createdAt: updatedLesson.createdAt,
      };

      return { lesson: result };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update lesson";
      console.error("Error updating lesson:", error);
      throw new Error(message);
    }
  });

/**
 * Delete a lesson
 *
 * @param input - Lesson ID and course ID
 * @returns Empty object on success
 */
export const deleteLessonAction = actionClient
  .inputSchema(deleteLessonSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // verify user owns the course
      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.courseId));

      if (!courseData) {
        throw new Error("Course not found");
      }

      if (courseData.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      const [existingLesson] = await db
        .select()
        .from(lesson)
        .where(
          and(
            eq(lesson.id, parsedInput.id),
            eq(lesson.courseId, parsedInput.courseId),
          ),
        );

      if (!existingLesson) {
        throw new Error("Lesson not found");
      }

      await db.delete(lesson).where(eq(lesson.id, parsedInput.id));

      return { success: true };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete lesson";
      console.error("Error deleting lesson:", error);
      throw new Error(message);
    }
  });

/**
 * Reorder lessons within a course
 *
 * @param input - Course ID and lessons with new order indices
 * @returns Empty object on success
 */
export const reorderLessonsAction = actionClient
  .inputSchema(reorderLessonsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // verify user owns the course
      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.courseId));

      if (!courseData) {
        throw new Error("Course not found");
      }

      if (courseData.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      for (const lessonUpdate of parsedInput.lessons) {
        const [existingLesson] = await db
          .select()
          .from(lesson)
          .where(
            and(
              eq(lesson.id, lessonUpdate.id),
              eq(lesson.courseId, parsedInput.courseId),
            ),
          );

        if (!existingLesson) {
          throw new Error(`Lesson ${lessonUpdate.id} not found in this course`);
        }

        await db
          .update(lesson)
          .set({ orderIndex: lessonUpdate.orderIndex })
          .where(eq(lesson.id, lessonUpdate.id));
      }

      return { success: true };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reorder lessons";
      console.error("Error reordering lessons:", error);
      throw new Error(message);
    }
  });

/**
 * Link a recording to a lesson
 *
 * @param input - Lesson ID and recording ID
 * @returns Updated lesson object
 */
export const linkRecordingToLessonAction = actionClient
  .inputSchema(linkRecordingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // get lesson and verify ownership through course
      const [lessonData] = await db
        .select()
        .from(lesson)
        .where(eq(lesson.id, parsedInput.lessonId));

      if (!lessonData) {
        throw new Error("Lesson not found");
      }

      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, lessonData.courseId));

      if (!courseData) {
        throw new Error("Course not found");
      }

      if (courseData.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      // update lesson with recording
      const [updatedLesson] = await db
        .update(lesson)
        .set({ recordingId: parsedInput.recordingId })
        .where(eq(lesson.id, parsedInput.lessonId))
        .returning();

      if (!updatedLesson) {
        throw new Error("Failed to link recording");
      }

      const result: Lesson = {
        id: updatedLesson.id,
        title: updatedLesson.title,
        orderIndex: updatedLesson.orderIndex,
        courseId: updatedLesson.courseId,
        recordingId: updatedLesson.recordingId,
        createdAt: updatedLesson.createdAt,
      };

      return { lesson: result };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to link recording";
      console.error("Error linking recording:", error);
      throw new Error(message);
    }
  });
