/**
 * Event serialization utilities for recording and playback
 *
 * CodeMirror transactions are complex objects that can't be directly serialized.
 * This module provides utilities to convert transactions to/from JSON-serializable
 * formats for storage and playback.
 */

import type { ChangeSpec, EditorState, Text, Transaction } from "@codemirror/state";

import {
  ChangeSet,
} from "@codemirror/state";

/**
 * Serializable representation of a single change
 *
 * A change is either:
 * - An insertion: `insert` is set, `from` and `to` are the same
 * - A deletion: `insert` is empty string, `from` < `to`
 * - A replacement: `insert` is set, `from` < `to`
 */
export type ChangeJSON = {
  from: number;
  to: number;
  insert: string;
};

/**
 * Serializable representation of a ChangeSet
 * An ordered array of changes to be applied to a document
 */
export type ChangeSetJSON = ChangeJSON[];

/**
 * Convert a CodeMirror ChangeSet to JSON format
 *
 * This extracts the individual changes from a ChangeSet and serializes them
 * as an array of {from, to, insert} objects that can be stored or transmitted.
 *
 * @param changeSet - The CodeMirror ChangeSet to serialize
 * @returns Array of serialized changes
 *
 * @example
 * const tr = editor.state.update({ changes: [{from: 0, to: 5, insert: "new"}] });
 * const json = toChangeSetJSON(tr.changes);
 * // Result: [{from: 0, to: 5, insert: "new"}]
 */
export function toChangeSetJSON(changeSet: ChangeSet): ChangeSetJSON {
  const changes: ChangeJSON[] = [];

  // Iterate through the changes in the ChangeSet
  changeSet.iterChanges((fromA, toA, fromB, toB, inserted) => {
    changes.push({
      from: fromA,
      to: toA,
      insert: inserted.toString(),
    });
  });

  return changes;
}

/**
 * Apply a serialized ChangeSet to a document
 *
 * Reconstructs the original CodeMirror ChangeSet from JSON and applies it
 * to the given document, returning the new document content.
 *
 * @param doc - The current document (as Text)
 * @param changes - The serialized changes
 * @returns The new document after applying changes
 *
 * @example
 * const changes = [{from: 0, to: 5, insert: "new"}];
 * const oldDoc = Text.of(["hello world"]);
 * const newDoc = applyChangeSetJSON(oldDoc, changes);
 * // Result: Text with "new world"
 */
export function applyChangeSetJSON(
  doc: InstanceType<typeof Text>,
  changes: ChangeSetJSON,
): InstanceType<typeof Text> {
  const specs: ChangeSpec[] = changes.map(change => ({
    from: change.from,
    to: change.to,
    insert: change.insert,
  }));

  const changeSet = ChangeSet.of(specs, doc.length);
  return changeSet.apply(doc);
}

/**
 * Extract serializable changes from a CodeMirror transaction
 *
 * @param tr - The CodeMirror transaction
 * @returns Serialized changes from the transaction
 */
export function transactionToChangeSetJSON(tr: Transaction): ChangeSetJSON {
  return toChangeSetJSON(tr.changes);
}

/**
 * Get the selection from a CodeMirror EditorState
 *
 * @param state - The editor state
 * @returns Selection range with anchor and head positions
 */
export function getSelectionJSON(
  state: EditorState,
): { anchor: number; head: number } {
  const selection = state.selection.main;
  return {
    anchor: selection.anchor,
    head: selection.head,
  };
}

/**
 * Time utilities for playback calculations
 */

/**
 * Calculate total duration of a sequence of recorded events
 *
 * @param events - Array of events with `time` property
 * @returns Total duration in milliseconds
 *
 * @example
 * const duration = totalDuration(recordedEvents);
 * // duration = last event time - first event time
 */
export function totalDuration(events: Array<{ time: number }>): number {
  if (events.length < 2)
    return 0;
  return events[events.length - 1]!.time - events[0]!.time;
}

/**
 * Calculate relative timestamp from start time
 *
 * @param startTime - Epoch timestamp when recording started
 * @param currentTime - Current epoch timestamp
 * @returns Relative time in milliseconds since start
 */
export function relativeTime(startTime: number, currentTime: number): number {
  return currentTime - startTime;
}
