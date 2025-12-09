"use client";

import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import type { File } from "~/types/coding-session";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export type FileTabsProps = {
  files: Map<string, File>;
  activeFile: string;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile?: (fileName: string) => void;
};

export function FileTabs({ files, activeFile, onSelectFile, onCreateFile, onDeleteFile }: FileTabsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const isButtonClickRef = useRef(false);

  const handleCreateClick = () => {
    setShowCreateDialog(true);
    setNewFileName("");
  };

  const handleCreateFile = () => {
    const trimmedName = newFileName.trim();
    if (!trimmedName) {
      return;
    }

    // Check if file already exists
    if (files.has(trimmedName)) {
      return;
    }

    onCreateFile(trimmedName);
    setShowCreateDialog(false);
    setNewFileName("");
  };

  const handleCancelCreate = () => {
    setShowCreateDialog(false);
    setNewFileName("");
  };

  const handleInputBlur = () => {
    // If a button was clicked, ignore the blur
    if (isButtonClickRef.current) {
      return;
    }

    const trimmedName = newFileName.trim();
    if (trimmedName && !files.has(trimmedName)) {
      // If there's text and it's not a duplicate, create the file
      onCreateFile(trimmedName);
      setShowCreateDialog(false);
      setNewFileName("");
    }
    else {
      // If there's no text or it's a duplicate, just close the dialog
      setShowCreateDialog(false);
      setNewFileName("");
    }
  };

  const handleDeleteFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation(); // Prevent tab selection when clicking delete
    onDeleteFile?.(fileName);
  };

  const canDelete = files.size > 1; // Don't allow deleting the last file

  return (
    <div className={`
      bg-background flex gap-0 overflow-x-auto border-b pt-2 pr-2 pb-0 pl-2
    `}
    >
      {Array.from(files.keys()).map(fileName => (
        <div
          key={fileName}
          className={`
            group flex items-center gap-1 rounded-t border px-4 py-2 text-sm
            whitespace-nowrap transition-all
            ${activeFile === fileName
          ? "border-muted bg-muted border-b-transparent"
          : `
            bg-background
            hover:bg-muted
          `}
          `}
        >
          <button
            type="button"
            onClick={() => onSelectFile(fileName)}
            className="flex-1 text-left"
          >
            {fileName}
          </button>
          {onDeleteFile && canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`
                h-4 w-4 opacity-0 transition-opacity
                group-hover:opacity-100
              `}
              onClick={e => handleDeleteFile(e, fileName)}
              aria-label={`Delete ${fileName}`}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {showCreateDialog
        ? (
            <div
              className={`
                bg-background flex items-center gap-2 rounded-t border
                border-b-0 px-2 py-2
              `}
            >
              <Input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                placeholder="File name (e.g., utils.js)"
                className="h-8 w-48 text-sm"
                autoFocus
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFile();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelCreate();
                  }
                }}
              />
              <Button
                onMouseDown={() => {
                  isButtonClickRef.current = true;
                }}
                onClick={() => {
                  handleCreateFile();
                  // Reset after click is processed
                  setTimeout(() => {
                    isButtonClickRef.current = false;
                  }, 0);
                }}
                variant="ghost"
                size="sm"
                disabled={!newFileName.trim() || files.has(newFileName.trim())}
                className="h-8"
              >
                Create
              </Button>
              <Button
                onMouseDown={() => {
                  isButtonClickRef.current = true;
                }}
                onClick={() => {
                  handleCancelCreate();
                  // Reset after click is processed
                  setTimeout(() => {
                    isButtonClickRef.current = false;
                  }, 0);
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        : (
            <Button
              onClick={handleCreateClick}
              variant="ghost"
              size="icon"
              className={`
                hover:border-muted
                rounded-t border border-b-0 border-transparent
              `}
              aria-label="Create new file"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
    </div>
  );
}
