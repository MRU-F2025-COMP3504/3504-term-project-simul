"use client";

import type { EditorState } from "@codemirror/state";

import { useCallback, useEffect, useState } from "react";

import type { EditorAPI, File } from "~/types/coding-session";

import { useEditorController } from "./use-editor-controller";

export type FilesManager = {
  files: Map<string, File>;
  activeFile: string;
  createFile: (
    fileName: string,
    content: EditorState,
    autoSelect?: boolean,
    selectOptions?: { skipEditorUpdate?: boolean },
  ) => void;
  selectFile: (fileName: string, options?: { skipEditorUpdate?: boolean }) => void;
  updateFileContent: (fileName: string, content: EditorState) => void;
  deleteFile: (fileName: string) => void;
  resetToStarter: (starterCode: EditorState) => void;
  loadFiles: (filesMap: Map<string, File>, activeFileName?: string) => void;
  saveCurrentFile: () => void;
};

/**
 * Hook for managing multi-file editor state
 *
 * Handles:
 * - File creation and deletion
 * - File switching with content persistence
 * - Active file tracking
 * - Integration with CodeMirror editor API
 *
 * @param initialStarter - The starter code for the initial file
 * @param editorApiRef - Reference to the CodeMirror editor API for reading/writing state
 * @returns Object with files map, activeFile, and file management operations
 */
export function useFilesManager(
  initialStarter: EditorState,
  editorApiRef: React.RefObject<EditorAPI | null>,
) {
  const editorController = useEditorController(editorApiRef);
  // Initialize with a single "main.js" file containing starter code
  const [files, setFiles] = useState<Map<string, File>>(() =>
    new Map([["main.js", { fileName: "main.js", content: initialStarter }]]),
  );

  const [pendingSelectFile, setPendingSelectFile]
    = useState<{ fileName: string; options?: { skipEditorUpdate?: boolean } } | null>(null);
  const [activeFile, setActiveFile] = useState("main.js");

  /**
   * Create a new file in the editor
   * - Checks for duplicates (no-op if file exists)
   * - Initializes with provided content
   * @param fileName - Name of the file to create
   * @param content - Initial content (EditorState) for the file
   * @param autoSelect - If true, automatically selects the file after creation (default: true)
   */
  const createFile = (
    fileName: string,
    content: EditorState,
    autoSelect = true,
    selectOptions?: { skipEditorUpdate?: boolean },
  ) => {
    if (files.has(fileName)) {
      throw new Error(`File "${fileName}" already exists.`);
    }
    const newFile: File = { fileName, content };
    setFiles(prev => new Map(prev).set(fileName, newFile));
    if (autoSelect) {
      setPendingSelectFile({ fileName, options: selectOptions });
    }
  };

  /**
   * Switch to a different file
   * - Persists current file content before switching
   * - Loads new file content into editor
   * - Updates activeFile state
   *
   * Note: Recording of file-switch events is handled by the caller
   * (useRecorder hook) to keep separation of concerns
   */
  const selectFile = useCallback((fileName: string, options?: { skipEditorUpdate?: boolean }) => {
    // No-op if file doesn't exist or already active
    if (!files.has(fileName)) {
      throw new Error(`File "${fileName}" does not exist.`);
    }
    if (activeFile === fileName) {
      return;
    }

    // Switch to new file
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setActiveFile(fileName);

    if (options?.skipEditorUpdate) {
      return;
    }

    // Update editor with new file content
    const fileEntry = files.get(fileName);
    if (fileEntry) {
      editorController.setEditorState(fileEntry.content);
    }
  }, [files, activeFile, editorController]);

  // We want to switch to the file after we create it
  // If we dont do this we get a race condition because react
  // batches state updates.
  useEffect(() => {
    if (pendingSelectFile) {
      selectFile(pendingSelectFile.fileName, pendingSelectFile.options);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setPendingSelectFile(null);
    }
  }, [files, pendingSelectFile, selectFile]);

  /**
   * Update the content of a specific file
   * - Updates the files map
   * - If it's the active file, the caller is responsible for updating the editor
   */
  const updateFileContent = (fileName: string, content: EditorState) => {
    if (!files.has(fileName)) {
      return;
    }

    setFiles((prev) => {
      const newMap = new Map(prev);
      const file = newMap.get(fileName);
      if (file) {
        newMap.set(fileName, { ...file, content });
      }
      return newMap;
    });
  };

  /**
   * Delete a file from the editor
   * - Checks that we don't delete the last remaining file
   * - If active file is deleted, switches to first available file
   */
  const deleteFile = (fileName: string) => {
    // Don't allow deleting the last file
    if (files.size <= 1) {
      return;
    }

    setFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });

    // If we deleted the active file, switch to the first available file
    if (activeFile === fileName) {
      const firstFile = Array.from(files.keys())[0];
      if (firstFile && firstFile !== fileName) {
        selectFile(firstFile);
      }
    }
  };

  /**
   * Reset the active file to starter code
   * - Updates the files map with new starter code
   * - Updates the editor to show the new content
   */
  const resetToStarter = (starterCode: EditorState) => {
    // Update files map
    setFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeFile, { fileName: activeFile, content: starterCode });
      return newMap;
    });

    editorController.setEditorState(starterCode);
  };

  /**
   * Save the current editor content to the active file
   * - Called when user makes changes to the document
   * - Updates the files map with current editor state
   */
  const saveCurrentFile = () => {
    const state = editorController.getEditorState();
    if (state) {
      updateFileContent(activeFile, state);
    }
  };

  /**
   * Load multiple files from a saved state
   * - Replaces the current files map with the provided files
   * - Sets the active file if specified
   * - Updates the editor to show the active file content
   */
  const loadFiles = (filesMap: Map<string, File>, activeFileName?: string) => {
    const clonedMap = new Map<string, File>();
    filesMap.forEach((file, name) => {
      clonedMap.set(name, { fileName: file.fileName, content: file.content });
    });

    setFiles(clonedMap);
    if (activeFileName && filesMap.has(activeFileName)) {
      setActiveFile(activeFileName);
      const fileEntry = clonedMap.get(activeFileName);
      if (fileEntry) {
        editorController.setEditorState(fileEntry.content);
      }
    }
  };

  return {
    files,
    activeFile,
    createFile,
    selectFile,
    updateFileContent,
    deleteFile,
    resetToStarter,
    saveCurrentFile,
    loadFiles,
  };
}
