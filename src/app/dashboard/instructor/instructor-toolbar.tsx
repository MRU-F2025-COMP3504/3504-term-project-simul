"use client";

import React from "react";

import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatDisplayTime } from "~/lib/coding-session/time";
import { SaveStatus } from "~/types/recording";

import { useInstructorSession } from "./instructor-session-context";

type Props = {
  isRecording: boolean;
  onToggleRecordingAction: () => void;
  onTogglePlaybackAction: () => void;

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
    onTogglePlaybackAction,

    showSaveDialog,
    openSaveDialogAction,
    closeSaveDialogAction,
    saveTitleInput,
    setSaveTitleInputAction,
    performSaveRecordingAction,
    saveStatus,
  } = props;

  const { recordedEvents, playbackTime, isPlaying } = useInstructorSession();

  const saveButtonLabel = () => {
    switch (saveStatus) {
      case SaveStatus.Idle:
        return "Save Recording";
      case SaveStatus.Saving:
        return "Saving...";
      case SaveStatus.Saved:
        return "✓ Saved";
      case SaveStatus.Error:
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

        {!isRecording && recordedEvents.length > 0 && (
          <>
            {showSaveDialog && (
              <div className="flex items-center gap-2">
                <Input
                  value={saveTitleInput}
                  onChange={e => setSaveTitleInputAction(e.target.value)}
                  placeholder="Recording title"
                  className="w-64"
                  disabled={saveStatus === SaveStatus.Saving}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void performSaveRecordingAction(saveTitleInput);
                    }
                  }}
                />
                <Button onClick={() => void performSaveRecordingAction(saveTitleInput)} disabled={saveStatus === SaveStatus.Saving || !saveTitleInput.trim()}>
                  Confirm
                </Button>
                <Button variant="ghost" onClick={closeSaveDialogAction} disabled={saveStatus === SaveStatus.Saving}>
                  Cancel
                </Button>
              </div>
            )}
            {!showSaveDialog && (
              <Button onClick={openSaveDialogAction} disabled={saveStatus === SaveStatus.Saving} variant={saveStatus === SaveStatus.Saved ? "default" : saveStatus === SaveStatus.Error ? "destructive" : "secondary"}>
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
