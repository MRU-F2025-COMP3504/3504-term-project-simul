"use client";

import { useState } from "react";

import type { EditorAPI, FileEntry } from "~/types/coding-session";

// TODO: This assumes that we only start with code in a single file.
// Needs to take an array of files for multi-file starters.
// TODO: This should be transitioned to using CodeMirror Transactions
// Needs to work with an updated FileEntry type that includes EditorState.
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
  initialStarter: string,
  editorApiRef: React.RefObject<EditorAPI | null>,
) {
  // Initialize with a single "main.js" file containing starter code
  const [files, setFiles] = useState<Map<string, FileEntry>>(() =>
    new Map([["main.js", { name: "main.js", content: initialStarter }]]),
  );

  const [activeFile, setActiveFile] = useState("main.js");

  /**
   * Create a new file in the editor
   * - Checks for duplicates (no-op if file exists)
   * - Initializes with empty content
   */
  const createFile = (fileName: string, content: string = "") => {
    if (files.has(fileName)) {
      return;
    }

    const newFile: FileEntry = { name: fileName, content };
    setFiles(prev => new Map(prev).set(fileName, newFile));
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
  const selectFile = (fileName: string) => {
    // No-op if file doesn't exist or already active
    if (!files.has(fileName) || activeFile === fileName) {
      return;
    }

    // Save current file content before switching
    if (editorApiRef.current) {
      const state = editorApiRef.current.getState();
      if (state) {
        const currentContent = state.doc.toString();
        setFiles((prev) => {
          const newMap = new Map(prev);
          newMap.set(activeFile, { name: activeFile, content: currentContent });
          return newMap;
        });
      }
    }

    // Switch to new file
    setActiveFile(fileName);

    // Update editor with new file content
    const fileEntry = files.get(fileName);
    if (fileEntry && editorApiRef.current) {
      const state = editorApiRef.current.getState();
      if (state) {
        const update = state.update({
          changes: {
            from: 0,
            to: state.doc.length,
            insert: fileEntry.content,
          },
        });
        editorApiRef.current.dispatch(update);
      }
    }
  };

  /**
   * Update the content of a specific file
   * - Updates the files map
   * - If it's the active file, the caller is responsible for updating the editor
   */
  const updateFileContent = (fileName: string, content: string) => {
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
  const resetToStarter = (starterCode: string) => {
    // Update files map
    setFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeFile, { name: activeFile, content: starterCode });
      return newMap;
    });

    // Update editor
    if (editorApiRef.current) {
      const state = editorApiRef.current.getState();
      if (state) {
        const update = state.update({
          changes: {
            from: 0,
            to: state.doc.length,
            insert: starterCode,
          },
        });
        editorApiRef.current.dispatch(update);
      }
    }
  };

  /**
   * Save the current editor content to the active file
   * - Called when user makes changes to the document
   * - Updates the files map with current editor state
   */
  const saveCurrentFile = () => {
    if (!editorApiRef.current) {
      return;
    }

    const state = editorApiRef.current.getState();
    if (state) {
      const currentContent = state.doc.toString();
      updateFileContent(activeFile, currentContent);
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
  };
}
