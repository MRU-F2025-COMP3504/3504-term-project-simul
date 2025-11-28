import { useState } from "react";
import { toast } from "sonner";

import type { SaveRecordingOptions } from "~/types/recording";

import { saveRecordingAction } from "~/lib/actions/recordings";
import { serializeEvent } from "~/lib/coding-session/events";
import { SaveStatus } from "~/types/recording";

export function useSaveRecording({ recordedEvents, filesManager, initialStateRef, problem }: SaveRecordingOptions) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitleInput, setSaveTitleInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.Idle);

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

    setSaveStatus(SaveStatus.Saving);

    try {
      // convert the Map to a serializable object
      const filesObject: Record<string, { name: string; content: string }> = {};
      for (const [fileName, fileData] of filesManager.files) {
        filesObject[fileName] = { name: fileData.fileName, content: fileData.content.doc.toString() };
      }

      // serialize the events client side before sending to server
      // const audioChunks = recordedEvents.filter(e => e.kind === "audio-chunk");
      // const eventTypes = recordedEvents.reduce((acc: Record<string, number>, e) => {
      //   acc[e.kind] = (acc[e.kind] || 0) + 1;
      //   return acc;
      // }, {});
      // console.warn("SAVE: Recording events breakdown:", eventTypes);
      // console.warn("SAVE: Total events:", recordedEvents.length, "Audio chunks:", audioChunks.length);

      const serializedEvents = await Promise.all(recordedEvents.map(serializeEvent));

      const initialCode = initialStateRef.current?.doc.toString() ?? problem.starterCode;

      await saveRecordingAction({
        title: title.trim(),
        problem,
        recordedEvents: serializedEvents,
        initialCode,
        files: filesObject,
        activeFile: filesManager.activeFile,
      });

      setSaveStatus(SaveStatus.Saved);

      // close dialog and reset title
      setShowSaveDialog(false);
      setSaveTitleInput("");

      setTimeout(() => setSaveStatus(SaveStatus.Idle), 3000);
    }
    catch (error) {
      // bubble and log
      console.error("Failed to save recording:", error);
      toast.error("Failed to save recording. Please try again.");
      setSaveStatus(SaveStatus.Error);

      setTimeout(() => setSaveStatus(SaveStatus.Idle), 3000);
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
