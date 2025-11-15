# Playback and Scrubbing

## Playback Engine (`usePlayer`)

`src/hooks/coding-session/use-player.ts` owns the playback loop. Consumers receive a `PlayerHandle` with `play`, `pause`, `seek`, `isPlaying`, and `playbackTime`.

### Keyframe and Index Preparation

- A `useMemo` walks the event list and creates two outputs:
  - **Keyframes**: snapshots created every `KF_EVERY_N` events plus the initial state. Each keyframe stores a deep-cloned `GlobalEditorState` and the index of the first event after that snapshot. Because `cloneState` rebuilds CodeMirror `EditorState` instances from plain text, these snapshots can be mutated safely.
  - **Time buckets**: checkpoints created whenever the timeline advances by `BUCKET_MS`. Each bucket points at the most recent keyframe and records the index of the next event at that time slice. **Currently buckets just copy the event index from the active keyframe, The intention is to restore the functionality, but Sunny is scared to touch the functionality after it was broken for so long**
- Buckets only appear once the recording crosses those 250 ms boundaries. Short segments (or early seeks) that never reach the next boundary leave the `index` array empty, so the keyframe data is used. 
- This runs once per recording load, after that the cached arrays are used.

### `seek(targetTime)`

The `seek` function reconstructs an editor snapshot for an arbitrary millisecond target time in five stages:

1. **Locate a bucket (if available)**: The function checks if the `index` array has timestamps at or before `targetTime`. The function sees how many `BUCKET_MS` intervals away the `targetTime` is from the first bucket and clamps that value to stay within the array. Because the subtraction can go negative (when `targetTime` is before the first bucket) the lookup guards with `Math.max(0, clampedBucketIndex)` to avoid negative array indices. If the resulting bucket’s timestamp still overshoots the target, it is ignored.

2. **Choose a keyframe anchor**: Since buckets contain a reference to the ideal keyframe to start from, that keyframe is used, otherwise the code falls back to a binary search (`upperBoundKF`) across the keyframes. Either path clamps the resulting index to stay within bounds so we always have a valid snapshot even when scrubbing before the first recorded event.

3. **Clone the baseline state**: `cloneState` converts the keyframe snapshot back into new `EditorState` instances and copies mouse coordinates. This means event replays do not mutate the cached keyframe.

4. **Determine the event pointer**: Keyframes store the index of the first event not yet applied at the time of the snapshot. Buckets can provide a later index (because they are emitted inside the keyframe span). The code picks the larger of the two so it replays only the events that fall between the anchor and the target time.

5. **Replay events up to `targetTime`**: A loop runs `reduce(state, event)` for every event whose timestamp is <= the requested time. Each reducer call applies the transaction, file switch/create, or mouse movement to the cloned snapshot without touching the live editor.

When the loop finishes, the returned `GlobalEditorState` matches the recording at exactly `targetTime`. Downstream callers pass it to `UpdateUIFromState`, which syncs the FilesManager and overlay, and updates `eventPointer` / `pausedAt` so playback resumes.

### Applying Events During Playback

- `play()` resets counters, shows the cursor overlay, and starts the `animationLoop` via `requestAnimationFrame`.
- The loop calculates the virtual playback clock from wall time (wall time: the time on your computer), applies any events whose timestamp is now in range, and keeps the UI in sync:
  - **Transactions** update the CodeMirror document, using `docSnapshot` when available and falling back to applying `ChangeSet`s.
  - **File switches** trigger `filesManager.selectFile` and swap the editor state.
  - **File creation** replays the creation inside the manager so the file tab matches the original session.
  - **Mouse events** update the cursor overlay.
- When the final event is consumed, playback stops automatically and hides the cursor indicator.


### UI

- `PlaybackControls` (`src/components/coding-session/playback-controls.tsx`)
  - The play/pause button toggles `usePlayer.play()` and `usePlayer.pause()` via the instructor session handler.
  - The `<input type="range">` slider emits `onSeek`, passing the slider value (in ms) straight to `player.seek`.
  - The slider background uses the current progress percentage for a simple scrub bar visualization.
- The total duration and the current playback timestamp are formatted with `formatDisplayTime` so the UI matches the instructor's expectations.
