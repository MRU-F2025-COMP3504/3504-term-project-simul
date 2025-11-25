import type { EditorState, Transaction } from "@codemirror/state";

import { useCallback } from "react";

import type { EditorAPI } from "~/types/coding-session";

export function useEditorController(editorApiRef: React.RefObject<EditorAPI | null>,
) {
  const setEditorState = useCallback((state: EditorState): void => {
    if (editorApiRef.current) {
      editorApiRef.current.setState(state);
    }
    else {
      throw new Error("Editor API is not available");
    }
  }, [editorApiRef]);
  const getEditorState = useCallback((): EditorState => {
    try {
      const state = editorApiRef.current!.getState();
      if (!state) {
        throw new Error("Editor state is not available");
      }
      return state;
    }
    catch (error) {
      throw new Error("Editor API is not available", { cause: error });
    }
  }, [editorApiRef]);

  const applyTransaction = useCallback((transaction: Transaction): void => {
    try {
      if (editorApiRef.current) {
        const update = getEditorState().update(transaction);
        editorApiRef.current.dispatch(update);
      }
      else {
        throw new Error("Editor API is not available");
      }
    }
    catch (error) {
      console.error("Failed to dispatch transaction:", error);
      throw error;
    }
  }, [editorApiRef, getEditorState]);

  return { setEditorState, getEditorState, applyTransaction };
}
