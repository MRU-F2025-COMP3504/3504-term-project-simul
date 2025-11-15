"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { RecordingList } from "~/components/recording-list";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
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
  onSelectRecording: (recordingId: string) => void;
};

export default function InstructorToolbar(props: Props) {
  const {
    isRecording,
    onToggleRecordingAction,
    onTogglePlaybackAction: _onTogglePlaybackAction,

    showSaveDialog,
    openSaveDialogAction,
    closeSaveDialogAction,
    saveTitleInput,
    setSaveTitleInputAction,
    performSaveRecordingAction,
    saveStatus,
    onSelectRecording,
  } = props;

  const { recordedEvents, playbackTime: _playbackTime, isPlaying: _isPlaying } = useInstructorSession();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const isInitialMount = useRef(true);

  // Load saved collapsed state from localStorage on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const savedCollapsed = localStorage.getItem("instructor-toolbar-collapsed");
      if (savedCollapsed) {
        try {
          const parsed = JSON.parse(savedCollapsed);
          // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
          setIsCollapsed(parsed);
        }
        catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("instructor-toolbar-collapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  // Automatically collapse toolbar when recording starts
  const prevIsRecording = useRef(isRecording);
  useEffect(() => {
    if (isRecording && !prevIsRecording.current) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsCollapsed(true);
    }
    prevIsRecording.current = isRecording;
  }, [isRecording]);

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
    <div className="bg-background/80 relative border-b backdrop-blur-sm">
      {isCollapsed
        ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                bg-background/80 absolute top-0 right-0 rounded-bl-lg border-r
                border-b px-2 py-1.5 shadow-sm backdrop-blur-sm
                transition-colors
                hover:bg-muted/50
              `}
              aria-label="Expand toolbar"
            >
              <ChevronDown className="text-muted-foreground size-4" />
            </button>
          )
        : (
            <>
              <div className="flex items-center justify-between gap-2 px-4 py-2">
                <span className="text-muted-foreground text-sm font-medium">Instructor Toolbar</span>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`
                    hover:bg-muted
                    rounded p-1 transition-colors
                  `}
                  aria-label="Collapse toolbar"
                >
                  <ChevronUp className="text-muted-foreground size-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 p-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button>Load Recording</Button>
                  </SheetTrigger>

                  <SheetContent>
                    <SheetTitle className="mt-4 ml-4 text-lg font-semibold">Available Recordings</SheetTitle>
                    <RecordingList onSelectRecording={onSelectRecording} />
                  </SheetContent>
                </Sheet>
                <Button onClick={onToggleRecordingAction}>
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
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

                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </div>
            </>
          )}
    </div>
  );
}
