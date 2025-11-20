import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";

import type { RecordedEvent } from "~/types/coding-session";

import { deserializeEvent, serializeEvent } from "~/lib/coding-session/events";

describe("coding-session events serialization", () => {
  it("preserves document snapshots for transaction events", () => {
    const baseState = EditorState.create({ doc: "console.log('hi');" });
    const transaction = baseState.update({
      changes: {
        from: 0,
        to: baseState.doc.length,
        insert: "console.log('bye');",
      },
    });

    const docSnapshot = transaction.newDoc.toString();

    const event: RecordedEvent = {
      time: 42,
      kind: "transaction",
      fileName: "main.js",
      transaction,
      selection: { anchor: 0, head: 0 },
      docSnapshot,
    };

    const serialized = serializeEvent(event);
    expect(serialized.eventData.docSnapshot).toBe(docSnapshot);

    const roundTripped = deserializeEvent(serialized);
    expect(roundTripped.docSnapshot).toBe(docSnapshot);
    expect(roundTripped.transaction?.changes.iterChanges).toBeDefined();
  });
});
