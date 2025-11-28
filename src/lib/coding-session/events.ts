/**
 * Event serialization utilities for recording and playback
 *
 * CodeMirror transactions are complex objects that can't be directly serialized.
 * This module provides utilities to convert transactions to/from JSON-serializable
 * formats for storage and playback.
 */

import type { ChangeSpec, Text, Transaction } from "@codemirror/state";

import { ChangeSet, EditorSelection } from "@codemirror/state";

import type { RecordedEvent } from "~/types/coding-session";

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
 * Serializable representation of a recorded event for storage
 * Replaces non-serializable Transaction objects with JSON-serializable data
 */
export type SerializedRecordedEvent = {
  time: number;
  kind: "transaction" | "mouse" | "file-switch" | "file-create" | "audio-chunk";
  fileName?: string;
  eventData: {
    Transaction?: {
      changes?: ChangeSet;
      selection?: EditorSelection;
    };

    // For mouse events
    mouse?: { x: number; y: number; type?: string; button?: number };
    // For file-create events
    fileContent?: string;
    // For audio events - store as base64 string with MIME type
    audioData?: string;
    audioMimeType?: string;
  };
};

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
  return tr.changes.toJSON();
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
export function totalDuration(events: Array<{ time: number; kind?: string }>): number {
  // Filter out audio chunks to get accurate duration based on editor events only
  const nonAudioEvents = events.filter(e => !("kind" in e) || e.kind !== "audio-chunk");

  if (nonAudioEvents.length < 2)
    return 0;

  // Round to integer to match database schema
  return Math.round(nonAudioEvents[nonAudioEvents.length - 1]!.time - nonAudioEvents[0]!.time);
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

/**
 * Convert Blob to base64 string for serialization
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:audio/webm;base64,)
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 string back to Blob with better error handling
 */
function base64ToBlob(base64: string, mimeType: string = "audio/webm"): Blob {
  try {
    // Clean up the base64 string (remove whitespace and validate)
    const cleanBase64 = base64.replace(/\s/g, "");

    if (!cleanBase64) {
      throw new Error("Empty base64 string");
    }

    const byteCharacters = atob(cleanBase64);
    const byteArray = new Uint8Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: mimeType });

    console.warn("DESERIALIZE: Created blob:", {
      size: blob.size,
      type: blob.type,
      base64Length: cleanBase64.length,
      originalMimeType: mimeType,
    });

    return blob;
  }
  catch (error) {
    console.error("DESERIALIZE: Failed to convert base64 to blob:", error, {
      base64Length: base64.length,
      mimeType,
      base64Sample: `${base64.substring(0, 50)}...`,
    });

    // Return empty blob as fallback
    return new Blob([], { type: mimeType });
  }
}

/**
 * Serialize a RecordedEvent to JSON-serializable format
 *
 * Converts non-serializable Transaction objects and other complex data
 * into JSON-compatible structures for storage.
 *
 * @param event - The recorded event to serialize
 * @returns JSON-serializable version of the event
 */
export async function serializeEvent(event: RecordedEvent): Promise<SerializedRecordedEvent> {
  const baseEvent = {
    time: event.time,
    kind: event.kind,
    fileName: event.fileName,
    eventData: {} as SerializedRecordedEvent["eventData"],
  };

  switch (event.kind) {
    case "transaction":
      if (event.transaction) {
        baseEvent.eventData.Transaction = {
          changes: event.transaction.changes?.toJSON(),
          selection: event.transaction.selection?.toJSON(),
        };
      }
      break;

    case "mouse":
      baseEvent.eventData.mouse = event.mouse;
      break;

    case "file-switch":
      // already in the base event, no other data needed
      break;

    case "file-create":
      baseEvent.eventData.fileContent = event.fileContent;
      break;

    case "audio-chunk":
      if (event.audioData) {
        // Convert Blob to base64 for serialization
        baseEvent.eventData.audioData = await blobToBase64(event.audioData);
        baseEvent.eventData.audioMimeType = event.audioData.type;
      }
      break;
  }

  return baseEvent;
}

/**
 * Deserialize a SerializedRecordedEvent back to RecordedEvent format
 *
 * Reconstructs the original event structure from stored JSON data.
 * Note: Transaction objects cannot be fully reconstructed from JSON,
 * but we preserve the changes data in a compatible format for playback.
 *
 * @param serializedEvent - The serialized event to deserialize
 * @returns Deserialized event with changes data preserved for playback
 */
export function deserializeEvent(serializedEvent: SerializedRecordedEvent): RecordedEvent {
  const baseEvent: RecordedEvent = {
    time: serializedEvent.time,
    kind: serializedEvent.kind,
    fileName: serializedEvent.fileName,
  };

  switch (serializedEvent.kind) {
    case "transaction":
      // Preserve changes data in a structure compatible with playback
      if (serializedEvent.eventData.Transaction) {
        // a full transaction cannot be reconstructed from serialized data, so instead
        // we create a minimal transaction-like object that holds
        // the serialized changes and selection during playback.
        const changes = ChangeSet.fromJSON(serializedEvent.eventData.Transaction.changes);
        const selection = serializedEvent.eventData.Transaction.selection
          ? EditorSelection.fromJSON(serializedEvent.eventData.Transaction.selection)
          : undefined;

        baseEvent.transaction = {
          changes,
          ...(selection && { selection }),
        } as unknown as Transaction;
      }
      break;

    case "mouse":
      baseEvent.mouse = serializedEvent.eventData.mouse;
      break;

    case "file-create":
      baseEvent.fileContent = serializedEvent.eventData.fileContent;
      break;

    case "audio-chunk":
      if (serializedEvent.eventData.audioData) {
        const mimeType = serializedEvent.eventData.audioMimeType || "audio/webm;codecs=opus";
        baseEvent.audioData = base64ToBlob(serializedEvent.eventData.audioData, mimeType);
      }
      break;
  }

  return baseEvent;
}
