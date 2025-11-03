# Recording Storage

## How Recording Storage Works

Recording storage is the system that saves and retrieves coding session recordings. When an instructor creates a recording of a coding session, it captures all the code changes, mouse movements, file operations, and test results so students can play it back later.

Our recording system has several key pieces:

1. **Database** - Recordings are stored as structured data in the database
2. **JSONB Fields** - Complex data (events, problems, files) stored as JSON (for now) in the database
3. **Server Actions** - Handle all recording CRUD operations
4. **Event Serialization** - Converts CodeMirror transactions to storable format

## Core Concepts

### Recording Structure

A recording contains everything needed to recreate a coding session:

- **Problem Definition** - The coding challenge being solved
- **Initial Code** - What the code looked like when recording started
- **Files** - All files in the session (name → content mapping)
- **Events** - Every keystroke, mouse move, and file operation
- **Metadata** - When it was created, how long it is, who created it

### JSONB Storage

We use PostgreSQL's JSONB type for complex nested data. Currently, our `problem`, `files`, and `events` fields are stored as JSONB because:

- **Events are large** - A recording might have hundreds or thousands of events
- **Always loaded together** - We never query individual events, always the whole array
- **Matches our types** - The database structure mirrors our TypeScript types exactly
- **Simpler queries** - No complex JOINs needed to load a recording

Eventually, we should consider breaking out some of these into separate tables, such as `problem`, to improve query performance and maintainability.

### Event Serialization

CodeMirror transactions can't be directly stored in a database, so we **serialize** them: converting complex objects into simple JSON that can be stored and later **deserialized** back into the original format for playback.

## Database Schema

The `recording` table structure:

```typescript
export const recording = pgTable("recording", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  
  // Complex data stored as JSONB
  problem: jsonb("problem").notNull(),           // ProblemDefinition
  files: jsonb("files").notNull(),               // Record<string, string>
  events: jsonb("events").notNull(),             // SerializedRecordedEvent[]
  
  // Text fields
  initialCode: text("initial_code").notNull(),
  activeFile: text("active_file").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  duration: integer("duration").notNull(),       // milliseconds
  
  // Relations
  instructorId: uuid("instructor_id")
    .references(() => user.id, { onDelete: "cascade" }),
});
```

## Using Recording Actions

> Quick anecdote from Matthew: When I started implementing this, I was originally planning to use a "repository" pattern for data access. This would be a separate layer that abstracts database operations. For instance, instead of directly using Drizzle ORM in the actions, I would have a `RecordingRepository` class with methods like `save`, `load`, `list`, and `delete`. This would encapsulate all database logic and make it easier to swap out the database layer later if needed.
>
> I opted against this for now to keep things simple and straightforward, but it's something to consider as the project grows.

### Save a Recording

Create and save a new recording:

```typescript
import { saveRecordingAction } from "~/lib/actions/recordings";

// Prepare the recording data
const result = await saveRecordingAction({
  title: "Two Sum Solution",
  problem: TWO_SUM_PROBLEM,
  recordedEvents: serializedEvents,
  initialCode: "function twoSum() {...}",
  files: {
    "solution.js": { name: "solution.js", content: "..." },
  },
  activeFile: "solution.js",
  instructorId: "optional-instructor-id",
});

if (result.data) {
  console.log("Saved with ID:", result.data.recordingId);
}
```

The action automatically:

- Validates the input with Zod
- Creates a `RecordingData` object with metadata
- Inserts into the database with Drizzle ORM
- Returns the new recording's UUID

### Load a Recording

Retrieve a recording by its ID:

```typescript
import { loadRecordingAction } from "~/lib/actions/recordings";

const result = await loadRecordingAction({ 
  id: "recording-uuid-here" 
});

if (result.data?.recording) {
  const { title, problem, events, files } = result.data.recording;
  // Use the recording data for playback
}
```

The action:

- Queries the database by ID
- Transforms the flat database row into nested `RecordingData` structure
- Converts timestamp to ISO string
- Handles JSONB field type casting

### List All Recordings

Get a list of all recordings (for the sidebar):

```typescript
import { listRecordingsAction } from "~/lib/actions/recordings";

const result = await listRecordingsAction();

if (result.data?.recordings) {
  result.data.recordings.forEach(recording => {
    console.log(recording.title);
    console.log(recording.problemTitle);   // Extracted from JSONB
    console.log(recording.duration);       // In milliseconds
    console.log(recording.createdAt);      // ISO timestamp
  });
}
```

The action:

- Queries all recordings ordered by newest first
- Extracts the problem title from the JSONB `problem` field
- Returns minimal metadata (not the full events array)

### Delete a Recording

Remove a recording from the database:

```typescript
import { deleteRecordingAction } from "~/lib/actions/recordings";

await deleteRecordingAction({ 
  id: "recording-uuid-here" 
});
```

**Note**: If the recording has an `instructorId`, it will be automatically deleted if that instructor is deleted (cascade delete).

## Working with Events

### Serializing Events

Before saving, convert CodeMirror events to JSON:

```typescript
import { serializeEvent } from "~/lib/coding-session/events";

// During recording
const recordedEvent: RecordedEvent = {
  time: Date.now(),
  kind: "transaction",
  fileName: "solution.js",
  transaction: codeTransaction,
  selection: { anchor: 10, head: 15 },
};

// Serialize for storage
const serialized = serializeEvent(recordedEvent);
// Now it's JSON-serializable and can be saved
```

### Deserializing Events

When loading, convert JSON back to events:

```typescript
import { deserializeEvent } from "~/lib/coding-session/events";

// After loading from database
const recording = await loadRecordingAction({ id: "..." });

const events = recording.data.recording.events.map(deserializeEvent);
// Now ready for playback
```

### Event Types

Recordings capture four types of events:

1. **Transaction Events** - Code changes (insertions, deletions)
2. **Mouse Events** - Cursor position and movements
3. **File Switch Events** - When the user changes active file
4. **File Create Events** - When a new file is created

All events include a timestamp for precise playback.

## Creating Recording Data

The `createRecordingData` helper transforms instructor state into a `RecordingData` object:

```typescript
import { createRecordingData } from "~/lib/recording-utils";

const recordingData = createRecordingData({
  title: "My Recording",
  problem: problemDefinition,
  recordedEvents: serializedEvents,
  initialCode: startingCode,
  files: {
    "main.js": { name: "main.js", content: "..." },
    "utils.js": { name: "utils.js", content: "..." },
  },
  activeFile: "main.js",
  instructorId: "optional-id",
});

// recordingData includes:
// - All the input data
// - metadata.createdAt (ISO timestamp)
// - metadata.duration (calculated from events)
// - id: "" (filled in by database)
```

This helper:

- Flattens the `files` map into a simple object
- Calculates total duration from event timestamps
- Adds creation timestamp
- Prepares data for database insertion
