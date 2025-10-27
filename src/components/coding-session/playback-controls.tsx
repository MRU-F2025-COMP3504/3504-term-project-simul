import type { RecordedEvent } from "~/types/coding-session";

import { formatDisplayTime } from "~/lib/coding-session/time";

export type PlaybackControlsProps = {
  isPlaying: boolean;
  playbackTime: number;
  recordedEvents: RecordedEvent[];
  recording: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek?: (time: number) => void;
};

export function PlaybackControls({
  isPlaying,
  playbackTime,
  recordedEvents,
  recording,
  onPlay,
  onPause,
  onSeek,
}: PlaybackControlsProps) {
  const totalTime = recordedEvents.length > 0 ? Math.max(...recordedEvents.map(e => e.time), 0) : 0;
  const progressPercentage = recordedEvents.length > 0 ? (playbackTime / Math.max(...recordedEvents.map(e => e.time), 1)) * 100 : 0;

  const handleTogglePlayback = () => {
    if (isPlaying) {
      onPause();
    }
    else {
      onPlay();
    }
  };

  const handleSeek = (time: number) => {
    if (!isPlaying && onSeek) {
      onSeek(time);
    }
  };

  return (
    <>
      {/* Video-style playback bar at bottom */}
      <div className="flex items-center gap-3 border-t bg-neutral-800 px-4 py-3">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={handleTogglePlayback}
          className={`
            flex size-8 cursor-pointer items-center justify-center rounded
            border-none text-base text-white transition-colors
            ${isPlaying
      ? `
        bg-red-500
        hover:bg-red-600
      `
      : `
        bg-blue-600
        hover:bg-blue-700
      `}
          `}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Current time / Total time */}
        <div className="min-w-20 text-[0.85rem] text-white">
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
            playback-range flex-1
            ${recordedEvents.length > 0
      ? `cursor-pointer`
      : `cursor-default`}
          `}
          style={{
            background: `linear-gradient(to right, #007bff 0%, #007bff ${progressPercentage}%, #555 ${progressPercentage}%, #555 100%)`,
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

      {/* CSS for range input styling */}
      <style>
        {`
        input[type="range"].playback-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"].playback-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
        }
        input[type="range"].playback-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
        }
        input[type="range"].playback-range::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          background: #555;
          border-radius: 3px;
        }
        input[type="range"].playback-range::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}
      </style>
    </>
  );
}
