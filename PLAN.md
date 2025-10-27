# Instructor Dashboard Refactoring Plan

## Overview

This document outlines a step-by-step plan to refactor the massive single-file instructor dashboard component (~1000 lines) into a modular, maintainable architecture. The component currently handles CodeMirror integration, multi-file editing, session recording/playback, test execution, and a complex UI.

## Current State Analysis

The component combines multiple responsibilities:

- CodeMirror editor integration with multi-file support
- Recording/playback of coding sessions (transactions, mouse movements, file operations)
- Test execution system for coding problems
- Complex UI with file sidebar, editor tabs, problem panel, and playback controls
- All state management, business logic, and presentation in a single file

## Target Architecture

### Folder Structure

```
src/
├── app/
│   └── dashboard/
│       └── instructor/
│           └── page.tsx (container/wiring only, ~100 lines)
├── components/
│   ├── coding-session/
│   │   ├── editor/
│   │   │   ├── CodeMirrorEditor.tsx
│   │   │   ├── FileTabs.tsx
│   │   │   └── CursorOverlay.tsx
│   │   ├── FileSidebar.tsx
│   │   ├── PlaybackControls.tsx
│   │   └── problem/
│   │       ├── ProblemPanel.tsx
│   │       ├── TestSummary.tsx
│   │       └── TestList.tsx
├── hooks/
│   └── coding-session/
│       ├── useFilesManager.ts
│       ├── useRecorder.ts
│       ├── usePlayer.ts
│       ├── useTestRunner.ts
│       └── useTimeline.ts (optional)
└── lib/
    └── coding-session/
        ├── types.ts
        ├── events.ts (transaction <-> JSON adapter)
        ├── tests/
        │   └── twoSum.ts
        ├── time.ts
        └── dom.ts
```

## Component Boundaries & Responsibilities

### 1. page.tsx (CodingSessionPage)

- **Role**: Container/orchestrator
- **Responsibilities**:
  - Compose all sub-components
  - Wire hooks to components
  - Minimal state orchestration
- **Size**: ~100-150 lines

### 2. CodeMirrorEditor

- **Role**: CodeMirror wrapper
- **Responsibilities**:
  - Manages useCodeMirror bridge
  - Emits normalized user edits, selections, mouse events
  - Receives value and selection from props
  - Exposes setDoc/setSelection for playback
- **Props**:
  ```typescript
  {
    value: string;
    onDocChange: (val: string) => void;
    onUserTransaction?: (tr: Transaction, sel?: {anchor:number; head:number}) => void;
    onMouseEvent?: (e: {x:number; y:number; type?: string; button?: number}) => void;
    setExternalStateRef?: React.MutableRefObject<{
      setDoc: (content: string) => void;
      setSelection: (sel: {anchor:number; head:number}) => void;
    } | null>;
  }
  ```

### 3. FileTabs

- **Role**: Tab navigation for open files
- **Responsibilities**: Display tabs, show active file, handle creation
- **Props**: files, activeFile, onSelectFile, onCreateFile

### 4. FileSidebar

- **Role**: File tree navigation
- **Responsibilities**: Display file list, handle file operations
- **Props**: files, activeFile, onCreateFile, onSelectFile

### 5. PlaybackControls

- **Role**: Video-style playback interface
- **Responsibilities**: Play/pause/stop, progress display, timeline scrubbing
- **Props**: isPlaying, currentTime, totalTime, onPlay, onPause, onStop, onSeek

### 6. ProblemPanel

- **Role**: Problem description and test orchestration
- **Responsibilities**: Submit/reset UI, compose TestSummary and TestList
- **Props**: testResults, onSubmit, onReset
- **Children**: TestSummary, TestList

### 7. CursorOverlay

- **Role**: Visual playback cursor
- **Responsibilities**: Render cursor dot at x/y position
- **Props**: position: {x,y} | null; visible: boolean

## State Management Strategy

### Recommendation: React Hooks First, Zustand Later (If Needed)

**Current Approach**: Use React hooks (useState/useReducer) + optional Context  
**When to Consider Zustand**: Only after hitting clear subscription/performance needs

### Why Not Zustand Now?

1. **Scale**: Single-page app with clear domains - hooks are sufficient
2. **Performance**: High-frequency playback state (50ms updates) should stay local in refs, not in global store
3. **Complexity**: One more dependency and mental model for marginal current benefit
4. **Migration Path**: Hooks-first design makes future Zustand migration trivial

### When to Add Zustand Later?

Consider Zustand when you encounter:

- 10+ components needing different slices of shared state
- Performance issues from Context rerenders despite splitting providers
- Need for store-level middleware (persist, devtools, history/undo)
- Complex subscription patterns across many components
- Server sync/collaboration features requiring centralized store

### Domain State Structure

Use a simple reducer or useState bundle in page.tsx:

```typescript
{
  // Low-frequency, app-level state (safe to share)
  files: Map<string, FileEntry>;
  activeFile: string;
  recording: boolean;
  recordedEvents: RecordedEvent[];  // append-only, not per-frame
  testResults: TestResults | null;
  isSubmitting: boolean;
  
  // High-frequency playback state (keep LOCAL in usePlayer)
  // DO NOT lift these to global state:
  // - playbackTime (updates 20Hz during playback)
  // - cursorPosition (updates per event)
  // - isPlaying (managed imperatively)
}
```

### Optional: Context for Prop Drilling

If prop drilling becomes painful (>3 levels), introduce **split contexts by domain**:

```typescript
// contexts/FilesContext.tsx
const FilesContext = createContext<FilesState>(...)
const useFiles = () => useContext(FilesContext)

// contexts/RecordingContext.tsx  
const RecordingContext = createContext<RecordingState>(...)
const useRecording = () => useContext(RecordingContext)

// contexts/TestsContext.tsx
const TestsContext = createContext<TestsState>(...)
const useTests = () => useContext(TestsContext)
```

**Critical**: Never put high-frequency values (playbackTime, cursorPos) in Context or any global state.

### Hook Responsibilities

Each hook owns specific domain logic and side effects:

1. **useFilesManager**: Manages file CRUD and switching
2. **useRecorder**: Translates CodeMirror transactions to serializable events
3. **usePlayer**: Applies recorded events to editor, drives timeline (keeps high-frequency state LOCAL)
4. **useTestRunner**: Executes test cases, manages results

### Data Flow

```
Editor → onChange/onSelection/onMouse → useRecorder → append events
                                      → useFilesManager → update files

PlaybackControls → play/pause → usePlayer (local state) → setEditorState
                                                        → update CursorOverlay
                                                        → local playbackTime

ProblemPanel → submit → useTestRunner → testResults → TestSummary/TestList
```

### Future: Zustand Migration Path (If Needed)

If you later need Zustand, use the **slices pattern**:

```typescript
// store/slices/filesSlice.ts
export const createFilesSlice = (set, get) => ({
  files: new Map(),
  activeFile: null,
  setActiveFile: (file) => set({ activeFile: file }),
  updateFile: (name, content) => set((state) => ({
    files: new Map(state.files).set(name, content)
  })),
})

// store/index.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useSessionStore = create()(
  devtools(
    persist(
      (...a) => ({
        ...createFilesSlice(...a),
        ...createRecordingSlice(...a),
        ...createTestsSlice(...a),
        // Still keep usePlayer separate for high-frequency state
      }),
      { 
        name: 'coding-session',
        partialize: (state) => ({ files: state.files, events: state.events })
      }
    )
  )
)

// Components use selectors for optimal rerenders
const activeFile = useSessionStore((s) => s.activeFile)
const updateFile = useSessionStore((s) => s.updateFile)
```

## Custom Hooks to Extract

### 1. useFilesManager.ts

```typescript
function useFilesManager(initialFiles: Map<string, FileEntry>) {
  return {
    files: Map<string, FileEntry>;
    activeFile: string;
    createFile: (name: string, content?: string) => void;
    selectFile: (name: string) => void;
    updateFileContent: (name: string, content: string) => void;
    deleteFile: (name: string) => void;
  }
}
```

### 2. useRecorder.ts

```typescript
function useRecorder({
  recording: boolean;
  activeFile: string;
  onEvent: (e: RecordedEvent) => void;
  getRelativeTime: () => number;
}) {
  return {
    recordTransaction: (tr: Transaction) => void;
    recordMouse: (evt: MouseEvent) => void;
    recordFileCreate: (name: string, content: string) => void;
    recordFileSwitch: (name: string) => void;
  }
}
```

**Key feature**: Convert CodeMirror transactions to serializable JSON via `events.ts`

### 3. usePlayer.ts

```typescript
function usePlayer({
  events: RecordedEvent[];
  getFile: (name: string) => FileEntry;
  setFile: (name: string, content: string) => void;
  setEditorDoc: (content: string) => void;
  setEditorSelection: (sel: Range) => void;
  onCursorMove: (pos: {x: number; y: number}) => void;
  onTimeUpdate: (time: number) => void;
}) {
  return {
    play: () => Promise<void>;
    pause: () => void;
    stop: () => void;
    isPlaying: boolean;
    playbackTime: number;
    totalTime: number;
  }
}
```

### 4. useTestRunner.ts

```typescript
function useTestRunner({
  getCurrentCode: () => string;
}) {
  return {
    submit: () => Promise<TestResults>;
    isSubmitting: boolean;
    results: TestResults | null;
    reset: () => void;
  }
}
```

## Utility Functions to Separate

### 1. lib/types.ts

Export all shared types:

- `FileEntry`
- `RecordedEvent` (union type)
- `TestCase`
- `TestResult`
- Serializable event types (TransactionEvent, MouseEvent, FileSwitchEvent, FileCreateEvent)

### 2. lib/events.ts

Transaction serialization:

- `toChangeJSON(tr: Transaction): ChangeJSON`
- `applyChangeJSON(view: EditorView, change: ChangeJSON): void`
- Selection helpers
- Timeline helpers: `totalDuration(events)`, `relativeTimestamp(start, now)`

### 3. lib/tests/twoSum.ts

Test execution:

- `export const TEST_CASES: TestCase[]`
- `export function runTwoSum(code: string): Promise<TestResults>`

### 4. lib/time.ts

Time utilities:

- `delay(ms: number): Promise<void>`
- `formatDisplayTime(timeInMs: number): string`

### 5. lib/dom.ts

DOM utilities:

- `positionWithin(element: HTMLElement, clientX: number, clientY: number): {x: number, y: number}`

## Refactoring Steps (Priority Order)

### Phase 1: Foundation (2-3 hours)

**Step 1.1: Extract Types & Constants** (~30 min)

- Create `lib/coding-session/types.ts`
- Move `FileEntry`, `RecordedEvent`, `TestCase` types
- Create `lib/coding-session/tests/twoSum.ts`
- Move `TEST_CASES` and starter code
- Update imports in page.tsx

**Step 1.2: Extract Time Utilities** (~30 min)

- Create `lib/coding-session/time.ts`
- Move `formatDisplayTime` function
- Add `delay` helper

### Phase 2: Presentational Components (3-5 hours)

**Step 2.1: FileSidebar Component** (~45 min)

- Create `components/coding-session/FileSidebar.tsx`
- Extract file list rendering
- Props: files, activeFile, onCreateFile, onSelectFile
- Keep all inline styles initially

**Step 2.2: FileTabs Component** (~45 min)

- Create `components/coding-session/editor/FileTabs.tsx`
- Extract tab bar rendering
- Props: files, activeFile, onSelectFile

**Step 2.3: PlaybackControls Component** (~1 hour)

- Create `components/coding-session/PlaybackControls.tsx`
- Extract bottom playback bar
- Props: isPlaying, currentTime, totalTime, recording, onPlay, onPause
- Include CSS animations

**Step 2.4: Problem Panel Components** (~1.5 hours)

- Create `components/coding-session/problem/TestSummary.tsx`
- Create `components/coding-session/problem/TestList.tsx`
- Create `components/coding-session/problem/ProblemPanel.tsx`
- Compose TestSummary + TestList + problem description

**Step 2.5: CursorOverlay Component** (~30 min)

- Create `components/coding-session/editor/CursorOverlay.tsx`
- Extract cursor rendering logic

### Phase 3: CodeMirror Isolation (2-3 hours)

**Step 3.1: CodeMirrorEditor Component** (~2 hours)

- Create `components/coding-session/editor/CodeMirrorEditor.tsx`
- Move useCodeMirror setup
- Implement clean prop interface
- Add setExternalStateRef for playback
- Normalize mouse event coordinates

**Step 3.2: Wire CodeMirrorEditor** (~1 hour)

- Update page.tsx to use new component
- Pass value from files map
- Wire up event handlers
- Test file switching

### Phase 4: Business Logic Hooks (6-8 hours)

**Step 4.1: useFilesManager Hook** (~1.5 hours)

- Create `hooks/coding-session/useFilesManager.ts`
- Implement file CRUD operations
- Handle active file state
- Optional: preserve per-file selection

**Step 4.2: Events Serialization** (~1.5 hours)

- Create `lib/coding-session/events.ts`
- Implement `toChangeJSON` for transaction serialization
- Implement `applyChangeJSON` for playback
- Write unit tests for round-trip encoding

**Step 4.3: useRecorder Hook** (~2 hours)

- Create `hooks/coding-session/useRecorder.ts`
- Convert transaction recording to use serializable events
- Handle relative timestamps from startTime ref
- Record file operations and mouse events

**Step 4.4: usePlayer Hook** (~3 hours)

- Create `hooks/coding-session/usePlayer.ts`
- Implement event scheduling loop
- Apply events deterministically
- Drive cursor overlay positioning
- Handle pause/stop cleanup

**Step 4.5: useTestRunner Hook** (~1.5 hours)

- Create `hooks/coding-session/useTestRunner.ts`
- Extract test execution logic
- Move `evaluateCode` function
- Clear results on edit

### Phase 5: Final Integration (1-2 hours)

**Step 5.1: Refactor page.tsx** (~1 hour)

- Use all extracted hooks
- Wire components together
- Remove all inline logic
- Keep only orchestration code

**Step 5.2: Testing & Cleanup** (~1 hour)

- Test all functionality end-to-end
- Verify recording/playback works
- Verify test execution works
- Clean up unused code

### Phase 6 (Optional): Advanced Improvements

**Step 6.1: Context API** (if needed, ~1 hour)

- Create SessionProvider with useReducer
- Actions: FILE_CREATE, FILE_SELECT, RECORD_START/STOP, etc.
- Only if prop drilling becomes painful

**Step 6.2: Style Cleanup** (deferred)

- Extract inline styles to CSS modules or Tailwind
- Create design tokens for colors/spacing

## Guardrails & Testing

### Event Fidelity

- **Risk**: JSON serialization loses transaction information
- **Mitigation**: Write unit tests for `events.ts` round-trip conversion
- **Test**: Apply encoded/decoded changes to known document, verify result

### Playback/Editor Divergence

- **Risk**: Editor state and files Map get out of sync
- **Mitigation**: Route all mutations through single "apply change" API
- **Test**: Verify files Map updated after every edit during playback

### Timer Leaks

- **Risk**: Playback intervals/timers not cleaned up
- **Mitigation**: Store interval IDs in refs, cleanup on unmount/stop
- **Test**: Check for memory leaks during repeated playback

### Mouse Coordinate Issues

- **Risk**: Coordinates recorded/played in wrong space
- **Mitigation**: Always use editor container-relative coordinates
- **Test**: Verify cursor appears at correct position during playback

## Estimated Effort

| Phase                   | Time Estimate   |
| ----------------------- | --------------- |
| Phase 1: Foundation     | 1-2 hours       |
| Phase 2: Presentational | 3-5 hours       |
| Phase 3: CodeMirror     | 2-3 hours       |
| Phase 4: Business Logic | 6-8 hours       |
| Phase 5: Integration    | 1-2 hours       |
| **Total**               | **13-20 hours** |

## Success Criteria

✅ **Code Quality**

- No file exceeds 200 lines
- Each component has single responsibility
- Clear separation of concerns

✅ **Functionality**

- All existing features work identically
- No regressions in recording/playback
- Tests execute correctly

✅ **Maintainability**

- Easy to add new test cases
- Easy to add new file operations
- Easy to modify playback behavior

✅ **Testability**

- Hooks can be unit tested
- Components can be tested in isolation
- Event serialization has test coverage

## Future Enhancements (Post-Refactor)

1. **Persistence**: Save/load sessions to server
2. **Web Worker Tests**: Move test execution off main thread
3. **Timeline Scrubbing**: Seek to specific time in playback
4. **Multi-Problem Support**: Abstract problem/test configuration
5. **Collaborative Features**: Real-time multi-user editing
6. **Performance**: Cache per-file EditorState, diff-based updates

## State Management: Zustand Decision

### Recommendation: Do Not Add Zustand Initially

After consulting with architecture experts, the recommendation is to **start with React hooks** and only add Zustand if you encounter specific problems.

#### Why Skip Zustand for Now?

1. **Current scale doesn't justify it**: Single-page application with clear, isolated domains
2. **Performance anti-pattern**: The hottest state path (playback at 50ms intervals) must stay local in refs/hooks - putting it in ANY global store (Context or Zustand) would hurt performance
3. **Hooks are sufficient**: useFilesManager, useRecorder, usePlayer, useTestRunner provide clean abstractions
4. **Easy migration path**: The hooks-first architecture makes future Zustand adoption trivial

#### When to Revisit Zustand?

Add Zustand when you encounter:

- **Wide subscriptions**: 10+ components needing different slices of shared state
- **Context performance issues**: Despite splitting providers, you see rerender problems
- **Store middleware needs**: Persist, devtools, history/undo at the store level
- **Complex collaboration**: Server sync or real-time features requiring centralized event sourcing

#### Zustand Benefits (For Future Reference)

- **No prop drilling**: Direct store access from any component
- **Selective rerendering**: Components only rerender when their selected state changes
- **Built-in middleware**: persist (localStorage/IndexedDB), devtools (Redux DevTools), immer (mutable updates)
- **Simple API**: No providers, reducers, or dispatch - just `useStore(selector)`
- **Transient updates**: Read/write state outside React without rerenders

See "Future: Zustand Migration Path" section above for implementation details if needed later.

## Notes

- Start with presentational extraction (no behavior change)
- Test after each major step
- Keep data flow simple - avoid premature optimization
- Use serializable events to enable future persistence
- Only introduce Context if prop drilling becomes painful (>3 levels)
- **Never** put high-frequency state (playback time, cursor position) in global state
