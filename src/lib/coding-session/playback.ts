/**
 * Utilities for recording and playback
 */

import { EditorState } from "@codemirror/state";

import type { File, GlobalEditorState } from "~/types/coding-session";

export function lowerBoundEvents(events: { time: number }[], time: number): number {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (events[mid].time < time)
      low = mid + 1;
    else high = mid;
  }
  return low; // first event whose time >= ts
}

export function upperBoundKF(keyframes: { time: number }[], target: number): number {
  let low = 0;
  let high = keyframes.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (keyframes[mid].time <= target)
      low = mid + 1;
    else high = mid;
  }
  return low; // index of first keyframe with time > target
}

/**
 * Clones a GlobalEditorState by creating new EditorState instances from document content.
 * Cannot use structuredClone because EditorState contains non-serializable functions.
 */
export function cloneState(state: GlobalEditorState): GlobalEditorState {
  const files = new Map<string, File>();
  for (const [name, file] of state.files) {
    files.set(name, {
      fileName: file.fileName,
      content: EditorState.create({ doc: file.content.doc.toString() }),
    });
  }
  const activeFromMap
    = {
      fileName: state.activeFile.fileName,
      content: EditorState.create({ doc: state.activeFile.content.doc.toString() }),
    };
  return {
    files,
    activeFile: activeFromMap,
    mouse: { ...state.mouse },
  };
}
