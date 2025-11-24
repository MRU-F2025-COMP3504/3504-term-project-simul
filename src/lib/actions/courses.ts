"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import type { Course, CourseWithLessons } from "~/types/course";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { course, lesson } from "~/lib/db/schema";
import { actionClient } from "~/lib/safe-action";

/**
 * Validation schemas for course operations
 */
const createCourseSchema = z.object({
  title: z.string().min(1).max(100, "Title must be 1-100 characters"),
  description: z.string().min(1).max(1000, "Description must be 1-1000 characters"),
  estimatedHours: z.number().int().positive("Estimated hours must be a positive number"),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional().default([]),
  thumbnailUrl: z.url("Invalid URL").nullable().optional().default(null),
});

const updateCourseSchema = z.object({
  id: z.uuid("Invalid course ID"),
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  estimatedHours: z.number().int().positive().optional(),
  tags: z.array(z.string()).max(5).optional(),
  thumbnailUrl: z.url().nullable().optional(),
});

const getCourseSchema = z.object({
  id: z.uuid("Invalid course ID"),
});

const deleteCourseSchema = z.object({
  id: z.uuid("Invalid course ID"),
});

/**
 * Create a new course
 *
 * @param input - Course creation data
 * @returns Created course object
 */
export const createCourseAction = actionClient
  .inputSchema(createCourseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to create a course");
      }

      if (session.user.role !== "instructor") {
        throw new Error("Unauthorized: Only instructors can create courses");
      }

      const [newCourse] = await db
        .insert(course)
        .values({
          title: parsedInput.title,
          description: parsedInput.description,
          estimatedHours: parsedInput.estimatedHours,
          tags: parsedInput.tags || [],
          thumbnailUrl: parsedInput.thumbnailUrl || null,
          instructorName: session.user.name || "Instructor",
          createdBy: session.user.id as string,
        })
        .returning();

      if (!newCourse) {
        throw new Error("Failed to create course");
      }

      const result: Course = {
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        thumbnailUrl: newCourse.thumbnailUrl,
        instructorName: newCourse.instructorName,
        estimatedHours: newCourse.estimatedHours,
        tags: newCourse.tags,
        createdBy: newCourse.createdBy,
        createdAt: newCourse.createdAt,
        updatedAt: newCourse.updatedAt,
      };

      return { course: result };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create course";
      console.error("Error creating course:", error);
      throw new Error(message);
    }
  });

/**
 * List all courses for the current instructor
 *
 * @returns Array of courses created by current user
 */
export const listUserCoursesAction = actionClient.action(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw new Error("Unauthorized: You must be logged in");
    }

    const courses = await db
      .select()
      .from(course)
      .where(eq(course.createdBy, session.user.id as string));

    const result: Course[] = courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl,
      instructorName: c.instructorName,
      estimatedHours: c.estimatedHours,
      tags: c.tags,
      createdBy: c.createdBy,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return { courses: result };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list courses";
    console.error("Error listing courses:", error);
    throw new Error(message);
  }
});

/**
 * Get a single course by ID with its lessons
 *
 * @param input - Course ID
 * @returns Course with lessons array
 */
export const getCourseAction = actionClient
  .inputSchema(getCourseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.id));

      if (!courseData) {
        throw new Error("Course not found");
      }

      // Check if user owns this course
      if (courseData.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      // Fetch lessons for this course
      const lessons = await db
        .select()
        .from(lesson)
        .where(eq(lesson.courseId, courseData.id));

      const courseWithLessons: CourseWithLessons = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
        instructorName: courseData.instructorName,
        estimatedHours: courseData.estimatedHours,
        tags: courseData.tags,
        createdBy: courseData.createdBy,
        createdAt: courseData.createdAt,
        updatedAt: courseData.updatedAt,
        lessons: lessons.map(l => ({
          id: l.id,
          title: l.title,
          orderIndex: l.orderIndex,
          courseId: l.courseId,
          recordingId: l.recordingId,
          createdAt: l.createdAt,
        })),
      };

      return { course: courseWithLessons };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get course";
      console.error("Error getting course:", error);
      throw new Error(message);
    }
  });

/**
 * Update a course
 *
 * @param input - Course ID and updated fields
 * @returns Updated course object
 */
export const updateCourseAction = actionClient
  .inputSchema(updateCourseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const [existingCourse] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.id));

      if (!existingCourse) {
        throw new Error("Course not found");
      }

      // Check ownership
      if (existingCourse.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      // Build update object with only provided fields.
      // This is gnarly, and I am sorry.
      const updateData: Record<string, unknown> = {};
      if (parsedInput.title !== undefined)
        updateData.title = parsedInput.title;
      if (parsedInput.description !== undefined)
        updateData.description = parsedInput.description;
      if (parsedInput.estimatedHours !== undefined)
        updateData.estimatedHours = parsedInput.estimatedHours;
      if (parsedInput.tags !== undefined)
        updateData.tags = parsedInput.tags;
      if (parsedInput.thumbnailUrl !== undefined)
        updateData.thumbnailUrl = parsedInput.thumbnailUrl;

      if (Object.keys(updateData).length === 0) {
        // No updates provided, return existing course
        const result: Course = {
          id: existingCourse.id,
          title: existingCourse.title,
          description: existingCourse.description,
          thumbnailUrl: existingCourse.thumbnailUrl,
          instructorName: existingCourse.instructorName,
          estimatedHours: existingCourse.estimatedHours,
          tags: existingCourse.tags,
          createdBy: existingCourse.createdBy,
          createdAt: existingCourse.createdAt,
          updatedAt: existingCourse.updatedAt,
        };
        return { course: result };
      }

      const [updatedCourse] = await db
        .update(course)
        .set(updateData)
        .where(eq(course.id, parsedInput.id))
        .returning();

      if (!updatedCourse) {
        throw new Error("Failed to update course");
      }

      const result: Course = {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        thumbnailUrl: updatedCourse.thumbnailUrl,
        instructorName: updatedCourse.instructorName,
        estimatedHours: updatedCourse.estimatedHours,
        tags: updatedCourse.tags,
        createdBy: updatedCourse.createdBy,
        createdAt: updatedCourse.createdAt,
        updatedAt: updatedCourse.updatedAt,
      };

      return { course: result };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update course";
      console.error("Error updating course:", error);
      throw new Error(message);
    }
  });

/**
 * Delete a course (cascades to lessons)
 *
 * @param input - Course ID
 * @returns Empty object on success
 */
export const deleteCourseAction = actionClient
  .inputSchema(deleteCourseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const [existingCourse] = await db
        .select()
        .from(course)
        .where(eq(course.id, parsedInput.id));

      if (!existingCourse) {
        throw new Error("Course not found");
      }

      // Check ownership
      if (existingCourse.createdBy !== (session.user.id as string)) {
        throw new Error("Unauthorized: You do not own this course");
      }

      await db.delete(course).where(eq(course.id, parsedInput.id));

      return { success: true };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete course";
      console.error("Error deleting course:", error);
      throw new Error(message);
    }
  });
