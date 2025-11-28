"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import type { Course } from "~/types/course";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { course, enrollment, lesson } from "~/lib/db/schema";
import { actionClient } from "~/lib/safe-action";

/**
 * Validation schemas for enrollment operations
 */
const courseIdSchema = z.object({
  courseId: z.uuid("Invalid course ID"),
});

/**
 * Enrollment result type
 */
export type EnrolledCourse = Course;

/**
 * Instructor stats type
 */
export type InstructorStats = {
  courseCount: number;
  lessonCount: number;
  totalRecordings: number;
};

/**
 * Get courses the student is enrolled in
 *
 * @returns Array of enrolled courses
 */
export const getStudentEnrolledCoursesAction = actionClient.action(
  async () => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // Get all enrollments for this user
      const enrollments = await db
        .select()
        .from(enrollment)
        .where(eq(enrollment.userId, session.user.id as string));

      // Get course IDs
      const courseIds = enrollments.map(e => e.courseId);

      if (courseIds.length === 0) {
        return { courses: [] };
      }

      // Get all courses matching enrollment IDs
      const courses = await db
        .select()
        .from(course)
        .where(inArray(course.id, courseIds));

      // Map to Course type
      const enrolledCourses: EnrolledCourse[] = courses.map(c => ({
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

      return { courses: enrolledCourses };
    }
    catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to get enrolled courses";
      console.error("Error getting enrolled courses:", error);
      throw new Error(message);
    }
  },
);

/**
 * Get all courses available for enrollment (exclude already-enrolled)
 *
 * @returns Array of courses not yet enrolled
 */
export const getAvailableCoursesForStudentAction = actionClient.action(
  async () => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      // Get all courses
      const allCourses = await db.select().from(course);

      // Get enrolled course IDs
      const enrolledCourses = await db
        .select()
        .from(enrollment)
        .where(eq(enrollment.userId, session.user.id as string));

      const enrolledCourseIds = new Set(enrolledCourses.map(e => e.courseId));

      // Filter out enrolled courses
      const availableCourses = allCourses.filter(
        c => !enrolledCourseIds.has(c.id),
      );

      // Map to Course type
      const courses: Course[] = availableCourses.map(c => ({
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

      return { courses };
    }
    catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to get available courses";
      console.error("Error getting available courses:", error);
      throw new Error(message);
    }
  },
);

/**
 * Enroll student in a course
 *
 * @param input - Course ID to enroll in
 * @returns Success status
 */
export const enrollInCourseAction = actionClient
  .inputSchema(courseIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id as string;
      const { courseId } = parsedInput;

      // Verify course exists
      const [courseData] = await db
        .select()
        .from(course)
        .where(eq(course.id, courseId));

      if (!courseData) {
        throw new Error("Course not found");
      }

      // Check if already enrolled
      const [existingEnrollment] = await db
        .select()
        .from(enrollment)
        .where(
          and(
            eq(enrollment.userId, userId),
            eq(enrollment.courseId, courseId),
          ),
        );

      if (existingEnrollment) {
        throw new Error("Already enrolled in this course");
      }

      // Create enrollment record
      await db.insert(enrollment).values({
        userId,
        courseId,
      });

      return { success: true };
    }
    catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to enroll in course";
      console.error("Error enrolling in course:", error);
      throw new Error(message);
    }
  });

/**
 * Check if student can access a course (has enrollment record)
 *
 * @param input - User ID and course ID
 * @returns Boolean indicating access
 */
export const canStudentAccessCourseAction = actionClient
  .inputSchema(z.object({
    courseId: z.string().uuid("Invalid course ID"),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id as string;
      const { courseId } = parsedInput;

      // Check enrollment record
      const [enrollmentRecord] = await db
        .select()
        .from(enrollment)
        .where(
          and(
            eq(enrollment.userId, userId),
            eq(enrollment.courseId, courseId),
          ),
        );

      return { canAccess: !!enrollmentRecord };
    }
    catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to check course access";
      console.error("Error checking course access:", error);
      throw new Error(message);
    }
  });

/**
 * Get all courses created by an instructor
 *
 * @returns Array of instructor's courses
 */
export const getInstructorCoursesAction = actionClient.action(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw new Error("Unauthorized: You must be logged in");
    }

    if (session.user.role !== "instructor") {
      throw new Error("Unauthorized: Only instructors can access this");
    }

    const instructorCourses = await db
      .select()
      .from(course)
      .where(eq(course.createdBy, session.user.id as string));

    const courses: Course[] = instructorCourses.map(c => ({
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

    return { courses };
  }
  catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Failed to get instructor courses";
    console.error("Error getting instructor courses:", error);
    throw new Error(message);
  }
});

/**
 * Get instructor stats (course count, lesson count, total recordings)
 *
 * @returns Instructor statistics
 */
export const getInstructorStatsAction = actionClient.action(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw new Error("Unauthorized: You must be logged in");
    }

    if (session.user.role !== "instructor") {
      throw new Error("Unauthorized: Only instructors can access this");
    }

    const userId = session.user.id as string;

    // Get all courses created by this instructor
    const instructorCourses = await db
      .select()
      .from(course)
      .where(eq(course.createdBy, userId));

    const courseCount = instructorCourses.length;
    const courseIds = instructorCourses.map(c => c.id);

    // Get lesson count for instructor's courses
    let lessonCount = 0;
    let totalRecordings = 0;

    if (courseIds.length > 0) {
      const lessons = await db
        .select()
        .from(lesson)
        .where(inArray(lesson.courseId, courseIds));

      lessonCount = lessons.length;

      // Count non-null recording IDs
      totalRecordings = lessons.filter(l => l.recordingId !== null).length;
    }

    const stats: InstructorStats = {
      courseCount,
      lessonCount,
      totalRecordings,
    };

    return { stats };
  }
  catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Failed to get instructor stats";
    console.error("Error getting instructor stats:", error);
    throw new Error(message);
  }
});
