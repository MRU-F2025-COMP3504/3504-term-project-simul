"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { RecordedEvent } from "~/types/coding-session";

export type UseAudioPlaybackOptions = {
  events: RecordedEvent[];
  isPlaying: boolean;
  currentTime: number;
  onLoadingChange?: (loading: boolean) => void;
  recording: boolean;
};

/**
 * Hook for playing back recorded audio synchronized with other events
 *
 * Manages audio playback timing to match the original recording timeline.
 * Handles audio blob reconstruction and playback synchronization.
 */
export function useAudioPlayback({
  events,
  isPlaying,
  currentTime,
  onLoadingChange,
  recording,
}: UseAudioPlaybackOptions) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayTimeRef = useRef<number>(0);
  const minEventsForAudio = 5;
  const audioSeekThreshold = 0.2; // seconds

  // Extract and concatenate audio chunks
  const reconstructAudio = useCallback(async (eventsToProcess: RecordedEvent[]) => {
    const audioEvents = eventsToProcess.filter(event =>
      event.kind === "audio-chunk" && event.audioData,
    );

    if (audioEvents.length === 0) {
      return null;
    }

    setIsLoading(true);
    onLoadingChange?.(true);

    try {
      // Sort audio chunks by timestamp
      const sortedChunks = audioEvents
        .sort((a, b) => a.time - b.time)
        .map(event => event.audioData!)
        .filter(Boolean);

      if (sortedChunks.length === 0) {
        return null;
      }

      // Validate chunk types and sizes
      // Ensure all chunks have the same MIME type
      const firstChunkType = sortedChunks[0]?.type || "audio/webm;codecs=opus";

      // Concatenate all audio blobs with proper MIME type
      const combinedBlob = new Blob(sortedChunks, {
        type: firstChunkType,
      });

      // Validate blob before creating URL
      if (!combinedBlob || combinedBlob.size === 0) {
        return null;
      }

      // Try to create URL for playback
      const url = URL.createObjectURL(combinedBlob);
      setAudioUrl(url);

      return url;
    }
    catch (err) {
      console.error("Audio reconstruction failed:", err);
      return null;
    }
    finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  // Initialize audio when events change
  useEffect(() => {
    // Skip all audio playback when actively recording to prevent conflicts
    if (recording) {
      return;
    }

    // Skip if we don't have enough events yet (likely still recording or just stopped)
    if (events.length < minEventsForAudio) {
      return;
    }

    let isCancelled = false;
    let currentAudio: HTMLAudioElement | null = null;

    const initAudio = async () => {
      try {
        // Check if we have any audio chunks first
        const audioEvents = events.filter(event =>
          event.kind === "audio-chunk" && event.audioData,
        );

        if (audioEvents.length === 0) {
          return;
        }

        const url = await reconstructAudio(events);

        if (isCancelled) {
          return;
        }

        if (!url) {
          return;
        }

        // Clean up previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        // Create new audio element with better configuration
        const audio = new Audio();
        audio.preload = "metadata"; // Help browser handle blob URLs better
        audio.crossOrigin = "anonymous"; // May help with blob URL resolution
        audioRef.current = audio;
        currentAudio = audio;

        // Set up audio event handlers
        audio.onerror = () => {
          // Most audio errors during playback initialization are recoverable or non-critical
          // Only treat decode errors as potentially serious
          const isCriticalError = audio.error && audio.error.code === 3; // MEDIA_ERR_DECODE

          if (!isCriticalError && audio.src !== url && url.startsWith("blob:")) {
            // Clear the current src and try again immediately
            audio.src = "";
            audio.src = url;
            audio.load();
          }
        };

        // Set the src after event handlers are configured
        audio.src = url;

        // Force a load to help with blob URL resolution
        audio.load();
      }
      catch (err) {
        console.error("Audio initialization failed:", err);
      }
    };

    // Only initialize for playback of complete recordings, never during live recording
    const audioEvents = events.filter(event => event.kind === "audio-chunk" && event.audioData);
    const hasNonAudioEvents = events.some(event => event.kind !== "audio-chunk");

    // Additional check: ensure we have a reasonable amount of audio data
    const minAudioChunks = 3; // Chunks needed for a viable recording
    const hasMinimumAudio = audioEvents.length >= minAudioChunks;

    // Only init if we have sufficient audio AND other events AND not currently playing
    if (hasMinimumAudio && hasNonAudioEvents && !isPlaying) {
      initAudio();
    }

    return () => {
      isCancelled = true;
      if (currentAudio) {
        currentAudio.onloadeddata = null;
        currentAudio.onerror = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  // Depend on recording state to prevent playback during active recording
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, isPlaying, recording]);

  // Sync audio playback with current time
  useEffect(() => {
    // Skip audio control during active recording
    if (recording || !audioRef.current || isLoading)
      return;

    const audio = audioRef.current;
    const shouldPlay = isPlaying && currentTime >= 0;

    if (shouldPlay) {
      // Calculate audio time based on recording timeline
      // Both audio and editor events are already normalized to the same recording start time
      // So we can directly use currentTime to calculate audio playback position

      const audioEvents = events.filter(e => e.kind === "audio-chunk" && e.time >= 0);

      // No audio events, nothing to play
      if (audioEvents.length === 0) {
        return;
      }

      // Find the first audio chunk to see when audio content actually starts
      const firstAudioTime = audioEvents[0].time;

      // Check if there are other events before the first audio chunk
      const allEvents = events.filter(e => e.time >= 0).sort((a, b) => a.time - b.time);
      const firstEventTime = allEvents.length > 0 ? allEvents[0].time : 0;

      // If there are editor events before the first audio chunk, we need to account for that
      // This handles the case where recording starts but audio takes time to initialize
      let audioTimelineStart = firstAudioTime;

      // If there are events before the first audio, we should start audio playback
      // relative to when recording actually started, not when audio started
      if (firstEventTime < firstAudioTime) {
        audioTimelineStart = firstEventTime;
      }

      // If we haven't reached the audio start point yet, don't play
      if (currentTime < audioTimelineStart) {
        if (!audio.paused) {
          audio.pause();
        }
        return;
      }

      // Calculate audio time relative to the audio timeline start
      const relativeAudioTime = (currentTime - audioTimelineStart) / 1000;
      const adjustedAudioTime = Math.max(0, relativeAudioTime);

      // Only proceed if audio is ready to play and has duration
      // 2 = HAVE_CURRENT_DATA
      if (audio.readyState >= 2 && !Number.isNaN(audio.duration) && audio.duration > 0 && adjustedAudioTime >= 0) {
        // Only seek if time difference is significant (avoid constant seeking)
        const timeDiff = Math.abs(audio.currentTime - adjustedAudioTime);
        if (timeDiff > audioSeekThreshold) { // 200ms threshold to reduce jitter
          const targetTime = Math.min(Math.max(0, adjustedAudioTime), audio.duration);
          try {
            audio.currentTime = targetTime;
          }
          catch (err) {
            console.error("Audio seeking failed:", err);
          }
        }

        // Play if not already playing
        if (audio.paused) {
          audio.play().catch((err) => {
            console.error("Audio playback failed:", err);
          });
        }
      }
    }
    else {
      // Pause audio when not playing
      if (!audio.paused) {
        audio.pause();
      }
    }

    lastPlayTimeRef.current = currentTime;
  }, [isPlaying, currentTime, events, isLoading, recording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const hasAudio = events.some(event => event.kind === "audio-chunk");

  return {
    hasAudio,
    isLoading,
    audioElement: audioRef.current,
  };
}
