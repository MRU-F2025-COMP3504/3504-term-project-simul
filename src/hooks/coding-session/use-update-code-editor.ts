import type { EditorState, Transaction } from "@codemirror/state";

import type { EditorAPI } from "~/types/coding-session";

export function useEditorController(editorApiRef: React.RefObject<EditorAPI | null>,
) {
  const setEditorState = (content: EditorState) => {
    if (editorApiRef.current) {
      editorApiRef.current.setState(content);
    }
    else {
      throw new Error("Editor API is not available");
    }
  };
  const getEditorState = (): EditorState | null => {
    if (editorApiRef.current) {
      return editorApiRef.current.getState();
    }
    else {
      throw new Error("Editor API is not available");
    }
  };

  const applyTransaction = (transaction: Transaction) => {
    try {
      if (editorApiRef.current) {
        const update = getEditorState()!.update(transaction);
        editorApiRef.current.dispatch(update);
      }
    }
    catch (error) {
      console.error("Failed to dispatch transaction:", error);
      throw error;
    }
  };

  return { setEditorState, getEditorState, applyTransaction };
}
