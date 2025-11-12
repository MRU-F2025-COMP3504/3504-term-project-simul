import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const recording = pgTable("recording", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),

  // TODO: create a schema for ProblemDefinition and use it here
  // currently not doing this for simplicity (#119)
  problem: jsonb("problem").notNull(),

  initialCode: text("initial_code").notNull(),
  files: jsonb("files").notNull(), // Record<string, { name: string; content: string }>
  activeFile: text("active_file").notNull(),

  events: jsonb("events").notNull(), // SerializedRecordedEvent[]

  createdAt: timestamp("created_at").defaultNow().notNull(),
  duration: integer("duration").notNull(), // milliseconds

  instructorId: uuid("instructor_id")
    .references(() => user.id, { onDelete: "cascade" }),
});
