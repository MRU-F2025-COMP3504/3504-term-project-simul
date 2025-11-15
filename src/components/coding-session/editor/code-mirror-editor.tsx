"use client";
import type { MouseEvent as ReactMouseEvent, ReactNode, RefObject } from "react";

import { javascript } from "@codemirror/lang-javascript";
import { EditorState, Transaction } from "@codemirror/state";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { useEffect, useImperativeHandle, useRef } from "react";

import type { EditorAPI, File } from "~/types/coding-session";

import { FileSidebar } from "./file-sidebar";
import { FileTabs } from "./file-tabs";

export type CodeMirrorEditorProps = {
  value: string;
  files: Map<string, File>;
  activeFile: string;
  onCreateFile: (fileName: string) => void;
  onSelectFile: (fileName: string) => void;
  onUserTransaction?: (tr: Transaction) => void;
  onEditorMouseMove?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
  setExternalApiRef?: RefObject<EditorAPI | null>;
  children?: ReactNode;
};

export function CodeMirrorEditor({
  value,
  files,
  activeFile,
  onCreateFile,
  onSelectFile,
  onUserTransaction,
  onEditorMouseMove,
  containerRef,
  setExternalApiRef,
  children,
}: CodeMirrorEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const { theme } = useTheme();

  const { view, setContainer } = useCodeMirror({
    container: editorContainerRef.current,
    theme: theme === "dark" ? "dark" : "light",
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
      setState: (state: EditorState) => {
        if (!view)
          return;
        view.setState(state);
      },
      getView: () => view ?? null,
      getState: () => view?.state ?? null,
      dispatch: (tr: Transaction) => {
        if (!view)
          return;
        view.dispatch(tr);
      },
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

    const currentDoc = view.state;
    if (!currentDoc)
      return;

    view.dispatch({
      changes: {
        from: 0,
        to: currentDoc.doc.length,
        insert: value,
      },
    });
  }, [view, value]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <FileSidebar
        files={files}
        activeFile={activeFile}
        onCreateFile={onCreateFile}
        onSelectFile={onSelectFile}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <FileTabs
          files={files}
          activeFile={activeFile}
          onSelectFile={onSelectFile}
        />
        <div
          className="relative flex-1 overflow-hidden"
          onMouseMove={onEditorMouseMove}
        >
          <div
            ref={(node) => {
              editorContainerRef.current = node;
              if (containerRef) {
                containerRef.current = node;
              }
            }}
            className="h-full w-full"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
