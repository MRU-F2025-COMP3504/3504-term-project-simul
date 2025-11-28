import { Pause, Play } from "lucide-react";

import { useInstructorSession } from "~/app/dashboard/instructor/instructor-session-context";
import { formatDisplayTime } from "~/lib/coding-session/time";

import styles from "./playback-controls.module.css";

export type PlaybackControlsProps = {
  recording: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek?: (time: number) => void;
  isLoadingRecording?: boolean;
};

export function PlaybackControls({
  recording,
  onPlay,
  onPause,
  onSeek,
  isLoadingRecording,
}: PlaybackControlsProps) {
  const { recordedEvents, playbackTime, isPlaying } = useInstructorSession();
  const totalTime = recordedEvents.length > 0 ? Math.max(...recordedEvents.map(e => e.time), 0) : 0;
  const progressPercentage = recordedEvents.length > 0 ? (playbackTime / Math.max(...recordedEvents.map(e => e.time), 1)) * 100 : 0;

  const handleTogglePlayback = () => {
    if (isLoadingRecording) {
      return;
    }
    if (isPlaying) {
      onPause();
    }
    else {
      onPlay();
    }
  };

  const handleSeek = (time: number) => {
    if (onSeek) {
      onSeek(time);
    }
  };

  return (
    <>
      <div className="bg-muted flex items-center gap-3 border-t px-4 py-1">
        <button
          type="button"
          onClick={handleTogglePlayback}
          disabled={isLoadingRecording}
          className={`
            text-primary-foreground flex size-6 cursor-pointer items-center
            justify-center rounded border-none text-sm transition-colors
            ${isLoadingRecording ? "cursor-not-allowed opacity-50" : ""}
            ${isPlaying
      ? `
        bg-destructive
        hover:bg-destructive/90
      `
      : `
        bg-primary
        hover:bg-primary/90
      `}
          `}
          title={isLoadingRecording ? "Loading..." : (isPlaying ? "Pause" : "Play")}
        >
          {isPlaying
            ? <Pause className="size-4 fill-white text-white" />
            : (
                <Play className="size-4 fill-white text-white" />
              )}
        </button>

        {/* Current time / Total time */}
        <div className="text-muted-foreground min-w-20 text-[0.85rem]">
          {formatDisplayTime(recordedEvents.length > 0 ? playbackTime : 0)}
          {" / "}
          {formatDisplayTime(totalTime)}
        </div>

        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max={recordedEvents.length > 0 ? Math.max(...recordedEvents.map(e => e.time), 1) : 0}
          value={playbackTime}
          onChange={e => handleSeek(Number(e.target.value))}
          className={`
            ${styles.playbackRange}
            flex-1
            ${recordedEvents.length > 0
      ? `cursor-pointer`
      : `cursor-default`}
          `}
          style={{
            background: `linear-gradient(to right, #007bff 0%, #007bff ${progressPercentage}%, var(--muted-foreground) ${progressPercentage}%, var(--muted-foreground) 100%)`,
          }}
        />

        {/* Recording indicator */}
        <div className="ml-auto flex items-center gap-2">
          {recording && (
            <div className="flex items-center gap-2">
              <div className="size-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-[0.85rem] text-red-500">Recording</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
