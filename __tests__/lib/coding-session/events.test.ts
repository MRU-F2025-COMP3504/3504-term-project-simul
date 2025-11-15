import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";

import type { RecordedEvent } from "~/types/coding-session";

import { deserializeEvent, serializeEvent } from "~/lib/coding-session/events";

describe("coding-session events serialization", () => {
  it("serializes transaction changes", () => {
    const baseState = EditorState.create({ doc: "console.log('hi');" });
    const transaction = baseState.update({
      changes: {
        from: 0,
        to: baseState.doc.length,
        insert: "console.log('bye');",
      },
    });

    const event: RecordedEvent = {
      time: 42,
      kind: "transaction",
      fileName: "main.js",
      transaction,
    };

    const serialized = serializeEvent(event);
    const eventData = serialized.eventData as Record<string, unknown>;

    expect(serialized.eventData.Transaction?.changes).toEqual(transaction.changes.toJSON());
    expect(serialized.eventData.Transaction?.selection).toEqual(transaction.selection?.toJSON());
    expect(eventData.docSnapshot).toBeUndefined();

    const roundTripped = deserializeEvent(serialized);
    expect(roundTripped.transaction?.changes.toJSON()).toEqual(transaction.changes.toJSON());
    expect(roundTripped.transaction?.selection?.toJSON()).toEqual(transaction.selection?.toJSON());
  });
});
