import type { EditorState as CMEditorState } from "@codemirror/state";

import { useState } from "react";
import { toast } from "sonner";

import type { RecordedEvent } from "~/types/coding-session";

import { saveRecordingAction } from "~/lib/actions/recordings";
import { serializeEvent } from "~/lib/coding-session/events";

type FilesManagerLike = {
  files: Map<string, { name: string; content: string }>;
  activeFile: string;
};

type UseSaveRecordingArgs = {
  recordedEvents: RecordedEvent[];
  filesManager: FilesManagerLike;
  initialStateRef: React.RefObject<CMEditorState | null>;
  problem: any;
};

export function useSaveRecording({ recordedEvents, filesManager, initialStateRef, problem }: UseSaveRecordingArgs) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitleInput, setSaveTitleInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const openSaveDialog = () => {
    if (recordedEvents.length === 0) {
      toast.warning("No recording to save. Please record a session first.");
      return;
    }
    setShowSaveDialog(true);
  };

  const performSaveRecording = async (title: string) => {
    if (!title || !title.trim()) {
      return;
    }

    setSaveStatus("saving");

    try {
      // convert the Map to a serializable object
      const filesObject: Record<string, { name: string; content: string }> = {};
      for (const [fileName, fileData] of filesManager.files) {
        filesObject[fileName] = fileData;
      }

      // serialize the events client side before sending to server
      const serializedEvents = recordedEvents.map(serializeEvent);

      const initialCode = initialStateRef.current?.doc.toString() ?? problem.starterCode;

      await saveRecordingAction({
        title: title.trim(),
        problem,
        recordedEvents: serializedEvents,
        initialCode,
        files: filesObject,
        activeFile: filesManager.activeFile,
      });

      setSaveStatus("saved");

      // close dialog and reset title
      setShowSaveDialog(false);
      setSaveTitleInput("");

      setTimeout(() => setSaveStatus("idle"), 3000);
    }
    catch (error) {
      // bubble and log
      console.error("Failed to save recording:", error);
      toast.error("Failed to save recording. Please try again.");
      setSaveStatus("error");

      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveTitleInput("");
  };

  return {
    showSaveDialog,
    openSaveDialog,
    saveTitleInput,
    setSaveTitleInput,
    performSaveRecording,
    closeSaveDialog,
    saveStatus,
  } as const;
}
