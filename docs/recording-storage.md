# Recording Storage

## How Recording Storage Works

Recording storage is the system that saves and retrieves coding session recordings. When an instructor creates a recording of a coding session, it captures all the code changes, mouse movements, file operations, and test results so students can play it back later.

Our recording system has several key pieces:

1. **Database** - Recordings are stored as structured data in the database
2. **JSONB Fields** - Complex data (events, problems, files) stored as JSON (for now) in the database
3. **Server Actions** - Handle all recording CRUD operations
4. **Event Serialization** - Converts CodeMirror transactions to storable format
5. **React Hooks** - Client-side hooks for managing recording state and operations
6. **Context Providers** - Shared state management for instructor sessions

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

Each serialized transaction now includes a `docSnapshot` (the document content immediately after the change). This snapshot gives the playback engine a safe fallback when a change set cannot be applied cleanly—for example, when loading older recordings or when the editor state has diverged. Keeping the snapshot ensures the document never collapses to an empty string during seeks or resume operations.

## Database Schema

The `recording` table structure:

```typescript
export const recording = pgTable("recording", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),

  // TODO: create a schema for ProblemDefinition and use it here
  // currently not doing this for simplicity (#119)
  problem: jsonb("problem").notNull(),

  initialCode: text("initial_code").notNull(),
  files: jsonb("files").notNull(), // Record<string, string>
  activeFile: text("active_file").notNull(),

  events: jsonb("events").notNull(), // SerializedRecordedEvent[]

  createdAt: timestamp("created_at").defaultNow().notNull(),
  duration: integer("duration").notNull(), // milliseconds

  instructorId: uuid("instructor_id")
    .references(() => user.id, { onDelete: "cascade" }),
});
```

## Client-Side State Management

Recording operations are managed through React hooks and context providers:

### Instructor Session Context

The `InstructorSessionProvider` manages shared state for instructor coding sessions:

```typescript
type InstructorSessionContextValue = {
  // Editor refs - shared between recorder, player, files manager
  editorApiRef: React.RefObject<{...}>;
  cursorRef: React.RefObject<HTMLDivElement | null>;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;

  // Recording state - shared between player, toolbar, playback controls
  recordedEvents: RecordedEvent[];
  setRecordedEvents: React.Dispatch<React.SetStateAction<RecordedEvent[]>>;

  // Playback state - shared between player, toolbar, playback controls
  playbackTime: number;
  setPlaybackTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;

  // Initial state ref - used by player for playback reset
  initialStateRef: React.RefObject<CMEditorState | null>;
};
```

### Save Recording Hook

The `useSaveRecording` hook handles the recording save process:

```typescript
export function useSaveRecording({
  recordedEvents,
  filesManager,
  initialStateRef,
  problem
}: SaveRecordingOptions) {
  // Returns: showSaveDialog, openSaveDialog, saveTitleInput, setSaveTitleInput,
  // performSaveRecording, closeSaveDialog, saveStatus
}
```

### Load Recording Hook

The `useLoadRecording` hook handles loading saved recordings:

```typescript
export function useLoadRecording(filesManager: EditorFiles) {
  const loadRecording = useCallback(async (recordingId: string) => {
    // Loads recording data and restores editor state
  }, [filesManager]);
}
```

## Using Recording Actions

> Quick anecdote from Matthew: When I started implementing this, I was originally planning to use a "repository" pattern for data access. This would be a separate layer that abstracts database operations. For instance, instead of directly using Drizzle ORM in the actions, I would have a `RecordingRepository` class with methods like `save`, `load`, `list`, and `delete`. This would encapsulate all database logic and make it easier to swap out the database layer later if needed.
>
> I opted against this for now to keep things simple and straightforward, but it's something to consider as the project grows.

### Save a Recording

Saving recordings is handled through the `useSaveRecording` hook:

```typescript
import { useSaveRecording } from "~/hooks/coding-session/use-save-recording";

function InstructorToolbar() {
  const { recordedEvents, filesManager, initialStateRef } = useInstructorSession();
  const { problem } = useProblemContext(); // hypothetical
  
  const {
    showSaveDialog,
    openSaveDialog,
    saveTitleInput,
    setSaveTitleInput,
    performSaveRecording,
    closeSaveDialog,
    saveStatus,
  } = useSaveRecording({
    recordedEvents,
    filesManager,
    initialStateRef,
    problem,
  });

  // Render save dialog and button
  return (
    <>
      <button onClick={openSaveDialog}>Save Recording</button>
      {showSaveDialog && (
        <SaveDialog
          title={saveTitleInput}
          onTitleChange={setSaveTitleInput}
          onSave={() => performSaveRecording(saveTitleInput)}
          onCancel={closeSaveDialog}
          status={saveStatus}
        />
      )}
    </>
  );
}
```

The hook automatically:

- Validates that there are events to save
- Serializes events client-side before sending to server
- Converts file Map to serializable object
- Calls the server action with proper error handling
- Provides UI state for save dialog and status

### Load a Recording

Loading recordings is handled through the `useLoadRecording` hook:

```typescript
import { useLoadRecording } from "~/hooks/coding-session/use-load-recording";

function RecordingList({ recordings }) {
  const filesManager = useFilesManager();
  const { loadRecording } = useLoadRecording(filesManager);

  const handleLoadRecording = async (recordingId: string) => {
    await loadRecording(recordingId);
  };

  return (
    <div>
      {recordings.map(recording => (
        <button
          key={recording.id}
          onClick={() => handleLoadRecording(recording.id)}
        >
          {recording.title}
        </button>
      ))}
    </div>
  );
}
```

The hook:

- Loads recording data from the server
- Deserializes events for playback
- Restores file state in the editor
- Resets playback state
- Sets initial editor state for playback

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

Before saving, convert CodeMirror events to JSON. This happens automatically in the `useSaveRecording` hook:

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

// Serialize for storage (happens automatically in useSaveRecording)
const serialized = serializeEvent(recordedEvent);
```

### Deserializing Events

When loading, convert JSON back to events. This happens automatically in the `useLoadRecording` hook:

```typescript
import { deserializeEvent } from "~/lib/coding-session/events";

// After loading from database (happens automatically in useLoadRecording)
const recording = await loadRecordingAction({ id: "..." });

const events = recording.data.recording.events.map(deserializeEvent);
// Now ready for playback
```

### Event Types

Recordings capture five types of events:

1. **Transaction Events** - Code changes (insertions, deletions, replacements)
2. **Mouse Events** - Cursor position and movements with optional click data
3. **File Switch Events** - When the user changes the active file
4. **File Create Events** - When a new file is created during recording
5. **File Operations** - File management actions

All events include a timestamp for precise playback.

## Playback Features

### Timeline Scrubbing

The playback system supports seeking to any point in the recording timeline:

```typescript
import { PlaybackControls } from "~/components/coding-session/playback-controls";

function InstructorInterface() {
  const { recordedEvents, playbackTime, isPlaying } = useInstructorSession();
  
  const handleSeek = (time: number) => {
    // Seek to specific time in recording
    setPlaybackTime(time);
    // Player will automatically update editor state
  };

  return (
    <PlaybackControls
      recording={false}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onSeek={handleSeek}
    />
  );
}
```

The `PlaybackControls` component provides:

- Play/pause toggle
- Current time and total duration display
- Interactive progress bar for seeking
- Recording indicator when actively recording

### Playback State Management

Playback state is managed through the instructor session context:

```typescript
const {
  recordedEvents,      // Array of events for playback
  playbackTime,        // Current playback position (ms)
  setPlaybackTime,     // Seek to new position
  isPlaying,          // Whether playback is active
  setIsPlaying,       // Start/stop playback
} = useInstructorSession();
```

## Creating Recording Data

The `createRecordingData` helper transforms instructor state into a `RecordingData` object. This is called internally by the server action:

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
