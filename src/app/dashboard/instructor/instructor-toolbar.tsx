"use client";

import React from "react";

import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatDisplayTime } from "~/lib/coding-session/time";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  isRecording: boolean;
  onToggleRecordingAction: () => void;
  isPlaying: boolean;
  onTogglePlaybackAction: () => void;
  recordedEventsCount: number;
  playbackTime: number;

  showSaveDialog: boolean;
  openSaveDialogAction: () => void;
  closeSaveDialogAction: () => void;
  saveTitleInput: string;
  setSaveTitleInputAction: (s: string) => void;
  performSaveRecordingAction: (title: string) => Promise<void>;
  saveStatus: SaveStatus;
};

export default function InstructorToolbar(props: Props) {
  const {
    isRecording,
    onToggleRecordingAction,
    isPlaying,
    onTogglePlaybackAction,
    recordedEventsCount,
    playbackTime,

    showSaveDialog,
    openSaveDialogAction,
    closeSaveDialogAction,
    saveTitleInput,
    setSaveTitleInputAction,
    performSaveRecordingAction,
    saveStatus,
  } = props;

  const saveButtonLabel = () => {
    switch (saveStatus) {
      case "idle":
        return "Save Recording";
      case "saving":
        return "Saving...";
      case "saved":
        return "✓ Saved";
      case "error":
        return "✗ Error";
      default:
        return "Save Recording";
    }
  };

  return (
    <div className="bg-background border-b p-4">
      <div className="flex items-center gap-2">
        <Button onClick={onToggleRecordingAction}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button onClick={onTogglePlaybackAction}>{isPlaying ? "Stop" : "Play"}</Button>

        {!isRecording && recordedEventsCount > 0 && (
          <>
            {showSaveDialog && (
              <div className="flex items-center gap-2">
                <Input
                  value={saveTitleInput}
                  onChange={e => setSaveTitleInputAction((e.target as HTMLInputElement).value)}
                  placeholder="Recording title"
                  className="w-64"
                  disabled={saveStatus === "saving"}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void performSaveRecordingAction(saveTitleInput);
                    }
                  }}
                />
                <Button onClick={() => void performSaveRecordingAction(saveTitleInput)} disabled={saveStatus === "saving" || !saveTitleInput.trim()}>
                  Confirm
                </Button>
                <Button variant="ghost" onClick={closeSaveDialogAction} disabled={saveStatus === "saving"}>
                  Cancel
                </Button>
              </div>
            )}
            {!showSaveDialog && (
              <Button onClick={openSaveDialogAction} disabled={saveStatus === "saving"} variant={saveStatus === "saved" ? "default" : saveStatus === "error" ? "destructive" : "secondary"}>
                {saveButtonLabel()}
              </Button>
            )}
          </>
        )}

        <div className="text-muted-foreground ml-4 text-xs">
          Playback time:
          {" "}
          {formatDisplayTime(playbackTime)}
        </div>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
