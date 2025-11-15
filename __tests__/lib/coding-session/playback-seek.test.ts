import type { Transaction } from "@codemirror/state";
import type { RefObject } from "react";

import { EditorState } from "@codemirror/state";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FilesManager } from "~/hooks/coding-session/use-files-manager";
import type { EditorAPI, File, RecordedEvent } from "~/types/coding-session";

import { usePlayer } from "~/hooks/coding-session/use-player";

function createAppendEvents(
  count: number,
  options: {
    transactionShape: "full" | "minimal";
    startTime?: number;
    step?: number;
    initialDoc?: string;
  },
): RecordedEvent[] {
  const {
    transactionShape,
    startTime = 0,
    step = 120,
    initialDoc = "",
  } = options;
  const events: RecordedEvent[] = [];
  let doc = initialDoc;

  for (let i = 0; i < count; i++) {
    const insert = String.fromCharCode(65 + (i % 26));
    const state = EditorState.create({ doc });
    const tr = state.update({
      changes: { from: doc.length, to: doc.length, insert },
    });

    doc = tr.newDoc.toString();

    const transaction: Transaction = transactionShape === "full"
      ? tr
      : { changes: tr.changes } as unknown as Transaction;

    events.push({
      time: startTime + i * step,
      kind: "transaction",
      fileName: "main.js",
      transaction,
    });
  }

  return events;
}

function createStubFilesManager(initialEditor: EditorState): FilesManager {
  const manager: FilesManager = {
    files: new Map<string, File>([["main.js", { fileName: "main.js", content: initialEditor }]]),
    activeFile: "main.js",
    createFile: vi.fn(),
    selectFile: vi.fn((fileName: string) => {
      manager.activeFile = fileName;
    }),
    updateFileContent: vi.fn(),
    deleteFile: vi.fn(),
    resetToStarter: vi.fn(),
    loadFiles: vi.fn((snapshot: Map<string, File>, activeFileName?: string) => {
      const cloned = new Map<string, File>();
      snapshot.forEach((file, key) => {
        cloned.set(key, {
          fileName: file.fileName,
          content: file.content,
        });
      });
      manager.files = cloned;
      if (activeFileName) {
        manager.activeFile = activeFileName;
      }
    }),
    saveCurrentFile: vi.fn(),
  };

  return manager;
}

function createEditorApiRef(initialEditor: EditorState): RefObject<EditorAPI | null> {
  return {
    current: {
      getState: vi.fn(() => initialEditor),
      dispatch: vi.fn(),
      setState: vi.fn(),
      getView: vi.fn(() => null),
    },
  };
}

function resolveDocAtTime(events: RecordedEvent[], initialDoc: string) {
  const cumulativeDocs: string[] = [];
  let currentDoc = initialDoc;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.kind !== "transaction") {
      cumulativeDocs[i] = currentDoc;
      continue;
    }

    if (event.transaction?.changes) {
      const state = EditorState.create({ doc: currentDoc });
      const nextDoc = event.transaction.changes.apply(state.doc);
      currentDoc = nextDoc.toString();
    }

    cumulativeDocs[i] = currentDoc;
  }

  return (time: number) => {
    let doc = initialDoc;
    for (let i = 0; i < events.length; i++) {
      const eventTime = events[i]?.time ?? Number.POSITIVE_INFINITY;
      if (eventTime > time) {
        break;
      }
      doc = cumulativeDocs[i] ?? doc;
    }
    return doc;
  };
}

function readActiveDoc(filesManager: FilesManager): string {
  const active = filesManager.files.get(filesManager.activeFile);
  expect(active).toBeDefined();
  return active!.content.doc.toString();
}

describe("usePlayer seek()", () => {
  it("reconstructs the document accurately when using full transaction objects", () => {
    const recordedEvents = createAppendEvents(30, { transactionShape: "full" });
    const initialEditor = EditorState.create({ doc: "" });
    const filesManager = createStubFilesManager(initialEditor);

    const editorApiRef = createEditorApiRef(initialEditor);
    const initialStateRef = { current: initialEditor } as RefObject<EditorState | null>;
    const cursorRef = { current: document.createElement("div") } as RefObject<HTMLDivElement | null>;
    const onPlaybackTimeChange = vi.fn();
    const onPlaybackStateChange = vi.fn();

    const { result } = renderHook(() => usePlayer({
      recordedEvents,
      filesManager,
      editorApiRef,
      initialStateRef,
      cursorRef,
      onPlaybackTimeChange,
      onPlaybackStateChange,
      isLoadingRecording: false,
    }));

    const expectedDocAt = resolveDocAtTime(recordedEvents, "");
    const maxTime = recordedEvents[recordedEvents.length - 1]!.time;

    for (let time = 0; time <= maxTime + 60; time += 60) {
      act(() => {
        result.current.seek(time);
      });
      const actual = readActiveDoc(filesManager);
      const expected = expectedDocAt(time);
      expect(actual).toBe(expected);
    }
  });

  it("reconstructs the document accurately when relying solely on ChangeSets", () => {
    const initialDoc = "seed";
    const recordedEvents = createAppendEvents(25, {
      transactionShape: "minimal",
      initialDoc,
    });
    const initialEditor = EditorState.create({ doc: initialDoc });
    const filesManager = createStubFilesManager(initialEditor);

    const editorApiRef = createEditorApiRef(initialEditor);
    const initialStateRef = { current: initialEditor } as RefObject<EditorState | null>;
    const cursorRef = { current: document.createElement("div") } as RefObject<HTMLDivElement | null>;
    const onPlaybackTimeChange = vi.fn();
    const onPlaybackStateChange = vi.fn();

    const { result } = renderHook(() => usePlayer({
      recordedEvents,
      filesManager,
      editorApiRef,
      initialStateRef,
      cursorRef,
      onPlaybackTimeChange,
      onPlaybackStateChange,
      isLoadingRecording: false,
    }));

    const expectedDocAt = resolveDocAtTime(recordedEvents, initialDoc);
    const maxTime = recordedEvents[recordedEvents.length - 1]!.time;

    for (let time = 0; time <= maxTime + 60; time += 90) {
      act(() => {
        result.current.seek(time);
      });
      expect(readActiveDoc(filesManager)).toBe(expectedDocAt(time));
    }
  });
});
