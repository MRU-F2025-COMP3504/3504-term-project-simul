import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { recording } from "./recordings";

export const course = pgTable("course", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  instructorName: text("instructor_name").notNull(),
  estimatedHours: integer("estimated_hours").notNull(),
  tags: text("tags").array().notNull().default([]),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const lesson = pgTable("lesson", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),

  courseId: uuid("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),

  recordingId: uuid("recording_id")
    .references(() => recording.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollment = pgTable("enrollment", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  courseId: uuid("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),

  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

// relations
export const courseRelations = relations(course, ({ one, many }) => ({
  instructor: one(user, {
    fields: [course.createdBy],
    references: [user.id],
  }),
  lessons: many(lesson),
  enrollments: many(enrollment),
}));

export const lessonRelations = relations(lesson, ({ one }) => ({
  course: one(course, {
    fields: [lesson.courseId],
    references: [course.id],
  }),
  recording: one(recording, {
    fields: [lesson.recordingId],
    references: [recording.id],
  }),
}));

export const enrollmentRelations = relations(enrollment, ({ one }) => ({
  user: one(user, {
    fields: [enrollment.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [enrollment.courseId],
    references: [course.id],
  }),
}));
