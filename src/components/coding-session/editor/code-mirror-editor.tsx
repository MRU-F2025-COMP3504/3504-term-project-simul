"use client";
import type { EditorState as CMEditorState } from "@codemirror/state";
import type { RefObject } from "react";

import { javascript } from "@codemirror/lang-javascript";
import { EditorSelection, EditorState, Transaction } from "@codemirror/state";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useImperativeHandle, useRef } from "react";

export type CodeMirrorEditorProps = {
  value: string;
  onUserTransaction?: (tr: Transaction) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
  setExternalApiRef?: RefObject<{
    setDoc: (content: string) => void;
    setSelection: (selection: { anchor: number; head: number }) => void;
    getState: () => CMEditorState | null;
  } | null>;
};

export function CodeMirrorEditor({
  value,
  onUserTransaction,
  containerRef,
  setExternalApiRef,
}: CodeMirrorEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const { view, setContainer } = useCodeMirror({
    container: editorContainerRef.current,
    extensions: [
      javascript(),
      EditorState.transactionFilter.of((tr: Transaction) => {
        // Only record user-driven transactions
        if (tr.annotation(Transaction.userEvent) && onUserTransaction) {
          onUserTransaction(tr);
        }
        return tr;
      }),
    ],
    basicSetup: {
      lineNumbers: true,
      highlightActiveLine: true,
      highlightActiveLineGutter: true,
    },
  });

  // Expose imperative API for playback
  useImperativeHandle(
    setExternalApiRef,
    () => ({
      setDoc: (content: string) => {
        if (!view)
          return;
        const docLength = view.state.doc.length;
        view.dispatch({
          changes: {
            from: 0,
            to: docLength,
            insert: content,
          },
        });
      },
      setSelection: (selection: { anchor: number; head: number }) => {
        if (!view)
          return;
        const selectionTr = view.state.update({
          selection: EditorSelection.single(selection.anchor, selection.head),
        });
        view.dispatch(selectionTr);
      },
      getState: () => view?.state ?? null,
    }),
    [view],
  );

  // Sync container ref
  useEffect(() => {
    if (editorContainerRef.current) {
      setContainer(editorContainerRef.current);
    }
  }, [setContainer]);

  // Initialize document content if empty
  useEffect(() => {
    if (!view || !value)
      return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc.length > 0)
      return;

    view.dispatch({
      changes: {
        from: 0,
        to: currentDoc.length,
        insert: value,
      },
    });
  }, [view, value]);

  return (
    <div
      ref={(node) => {
        editorContainerRef.current = node;
        if (containerRef) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className="relative flex-1 overflow-hidden"
    />
  );
}
