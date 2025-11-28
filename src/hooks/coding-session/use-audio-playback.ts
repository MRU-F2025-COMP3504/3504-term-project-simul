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

  // Extract and concatenate audio chunks
  const reconstructAudio = useCallback(async (eventsToProcess: RecordedEvent[]) => {
    const audioEvents = eventsToProcess.filter(event =>
      event.kind === "audio-chunk" && event.audioData,
    );

    console.warn("Found", audioEvents.length, "audio chunks to reconstruct");

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

      console.warn("AUDIO RECONSTRUCT: Sorted chunks:", sortedChunks.map(c => ({
        size: c.size,
        type: c.type,
      })));

      if (sortedChunks.length === 0) {
        console.error("AUDIO RECONSTRUCT: No valid audio chunks after filtering");
        return null;
      }

      // Validate chunk types and sizes
      const chunkInfo = sortedChunks.map((chunk, i) => ({
        index: i,
        size: chunk.size,
        type: chunk.type,
      }));

      console.warn("AUDIO RECONSTRUCT: Chunk details:", chunkInfo);

      // Ensure all chunks have the same MIME type
      const firstChunkType = sortedChunks[0]?.type || "audio/webm;codecs=opus";
      const hasConsistentTypes = sortedChunks.every(chunk => chunk.type === firstChunkType);

      if (!hasConsistentTypes) {
        console.warn("AUDIO RECONSTRUCT: Inconsistent chunk types, using first chunk type:", firstChunkType);
      }

      // Concatenate all audio blobs with proper MIME type
      const combinedBlob = new Blob(sortedChunks, {
        type: firstChunkType,
      });

      console.warn("AUDIO RECONSTRUCT: Combined audio blob:", {
        size: combinedBlob.size,
        type: combinedBlob.type,
        chunksUsed: sortedChunks.length,
        totalOriginalSize: sortedChunks.reduce((sum, chunk) => sum + chunk.size, 0),
        hasConsistentTypes,
      });

      if (combinedBlob.size === 0) {
        console.error("AUDIO RECONSTRUCT: Combined blob is empty");
        return null;
      }

      // Additional validation: check if blob seems valid
      if (combinedBlob.size < 100) {
        console.warn("AUDIO RECONSTRUCT: Combined blob suspiciously small:", combinedBlob.size);
      }

      // Validate blob before creating URL
      if (!combinedBlob || combinedBlob.size === 0) {
        console.error("AUDIO RECONSTRUCT: Invalid blob for URL creation");
        return null;
      }

      // Try to create URL for playback
      const url = URL.createObjectURL(combinedBlob);
      setAudioUrl(url);

      // Test if the browser can likely play this audio type
      const testAudio = document.createElement("audio");
      const canPlayType = testAudio.canPlayType(combinedBlob.type);

      console.warn("AUDIO RECONSTRUCT: Browser canPlayType result:", {
        mimeType: combinedBlob.type,
        canPlayType,
        url: `${url.substring(0, 50)}...`,
        blobSize: combinedBlob.size,
        blobValid: combinedBlob instanceof Blob,
      });

      if (canPlayType === "") {
        console.warn("AUDIO RECONSTRUCT: Browser cannot play this audio type, but proceeding anyway");
      }

      // Try to validate the blob by attempting to read a small portion
      try {
        const slice = combinedBlob.slice(0, 100);
        const arrayBuffer = await slice.arrayBuffer();
        console.warn("AUDIO RECONSTRUCT: Blob validation - first 10 bytes:", Array.from(new Uint8Array(arrayBuffer, 0, 10)));
      }
      catch (err) {
        console.error("AUDIO RECONSTRUCT: Blob validation failed:", err);
      }

      return url;
    }
    catch (error) {
      console.error("Failed to reconstruct audio:", error);
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
      console.warn("AUDIO: Skipping playback initialization during active recording");
      return;
    }

    // Skip if we don't have enough events yet (likely still recording or just stopped)
    if (events.length < 5) {
      console.warn("AUDIO: Skipping initialization - too few events, likely still recording");
      return;
    }

    let isCancelled = false;
    let currentAudio: HTMLAudioElement | null = null;

    const handleLoadedData = () => {
      // Audio is ready for playback
    };

    const handleError = (e: string | Event) => {
      if (e instanceof Event && e.target) {
        const audio = e.target as HTMLAudioElement;
        const errorDetails = {
          eventType: e.type,
          audioSrc: audio.src,
          audioError: audio.error
            ? {
                code: audio.error.code,
                message: audio.error.message,
                MEDIA_ERR_ABORTED: audio.error.code === 1,
                MEDIA_ERR_NETWORK: audio.error.code === 2,
                MEDIA_ERR_DECODE: audio.error.code === 3,
                MEDIA_ERR_SRC_NOT_SUPPORTED: audio.error.code === 4,
              }
            : null,
          networkState: audio.networkState,
          readyState: audio.readyState,
          srcLength: audio.src.length,
        };
        console.warn("Audio playback issue (non-critical):", errorDetails);
      }
      else {
        console.warn("Audio playback issue (non-critical):", e);
      }
    };

    const initAudio = async () => {
      try {
        // Check if we have any audio chunks first
        const audioEvents = events.filter(event =>
          event.kind === "audio-chunk" && event.audioData,
        );

        if (audioEvents.length === 0) {
          console.warn("AUDIO: No audio chunks available, skipping initialization");
          return;
        }

        console.warn("AUDIO: Starting audio reconstruction with", audioEvents.length, "chunks");
        const url = await reconstructAudio(events);

        console.warn("AUDIO: Audio reconstruction result - url:", url);

        if (isCancelled) {
          console.warn("AUDIO: Operation cancelled during reconstruction");
          return;
        }

        if (!url) {
          console.warn("AUDIO: No URL returned from reconstruction, skipping audio setup");
          return;
        }

        // Clean up previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        console.warn("AUDIO: Creating new Audio element with URL:", url);

        try {
        // Create new audio element with better configuration
          const audio = new Audio();
          audio.preload = "metadata"; // Help browser handle blob URLs better
          audio.crossOrigin = "anonymous"; // May help with blob URL resolution
          audioRef.current = audio;
          currentAudio = audio;

          console.warn("AUDIO: Created audio element, setting src to:", url);
          console.warn("AUDIO: Blob URL validation:", {
            isBlob: url.startsWith("blob:"),
            length: url.length,
            protocol: new URL(url).protocol,
          });

          // Set up audio event handlers
          audio.onloadeddata = handleLoadedData;
          audio.onerror = (e) => {
          // Get more detailed error information
            const errorInfo = {
              eventType: e instanceof Event ? e.type : typeof e,
              eventData: e instanceof Event ? "Event object" : String(e),
              originalUrl: url,
              currentSrc: audio.src,
              urlMatches: audio.src === url,
              urlValid: url.startsWith("blob:"),
              audioError: audio.error
                ? {
                    code: audio.error.code,
                    message: audio.error.message,
                    MEDIA_ERR_ABORTED: audio.error.code === 1,
                    MEDIA_ERR_NETWORK: audio.error.code === 2,
                    MEDIA_ERR_DECODE: audio.error.code === 3,
                    MEDIA_ERR_SRC_NOT_SUPPORTED: audio.error.code === 4,
                  }
                : null,
              networkState: audio.networkState,
              readyState: audio.readyState,
              canPlayType: audio.canPlayType ? audio.canPlayType("audio/webm") : "unknown",
              srcStartsWith: audio.src.substring(0, 20),
              urlStartsWith: url.substring(0, 20),
            };

            console.warn("AUDIO: Error event triggered:", errorInfo);

            // Most audio errors during playback initialization are recoverable or non-critical
            // Only treat decode errors as potentially serious
            const isCriticalError = audio.error && audio.error.code === 3; // MEDIA_ERR_DECODE

            if (!isCriticalError) {
              console.warn("AUDIO: Treating as non-critical error, attempting recovery if needed");

              // If the currentSrc doesn't match our blob URL, try to fix it
              if (audio.src !== url && url.startsWith("blob:")) {
                console.warn("AUDIO: Detected blob URL mismatch, attempting to recreate audio element");

                // Clear the current src and try again immediately
                audio.src = "";
                audio.src = url;
                audio.load();
                console.warn("AUDIO: Recreated audio with blob URL");
              }
            }
            else {
              console.warn("AUDIO: Critical decode error detected, but continuing anyway");
            // Even decode errors shouldn't crash the app - just log them
            }
          };

          // Also listen for other audio events that might give us clues
          audio.onloadstart = () => console.warn("AUDIO: loadstart");
          audio.oncanplay = () => console.warn("AUDIO: canplay - ready to play");
          audio.oncanplaythrough = () => console.warn("AUDIO: canplaythrough - can play without stopping");
          audio.onstalled = () => console.warn("AUDIO: stalled - download stalled");
          audio.onemptied = () => console.warn("AUDIO: emptied - network empty");
          audio.onabort = () => console.warn("AUDIO: abort - playback aborted");
          audio.onsuspend = () => console.warn("AUDIO: suspend - loading suspended");
          audio.onwaiting = () => console.warn("AUDIO: waiting - waiting for data");
          audio.ondurationchange = () => console.warn("AUDIO: duration changed to:", audio.duration);

          console.warn("AUDIO: Audio element created and event handlers set");

          // Set the src after event handlers are configured
          audio.src = url;
          console.warn("AUDIO: Set audio.src to:", audio.src);

          // Force a load to help with blob URL resolution
          audio.load();
          console.warn("AUDIO: Called audio.load() to force loading");
        }
        catch (audioError) {
          console.error("AUDIO: Failed to create Audio element:", audioError);
          handleError(`Audio element creation failed: ${audioError}`);
        }
      }
      catch (error) {
        console.error("AUDIO: Error during audio initialization:", error);
      }
    };

    // Only initialize for playback of complete recordings, never during live recording
    const audioEvents = events.filter(event => event.kind === "audio-chunk" && event.audioData);
    const hasNonAudioEvents = events.some(event => event.kind !== "audio-chunk");

    // Additional check: ensure we have a reasonable amount of audio data
    const minAudioChunks = 3; // At least 3 audio chunks for a viable recording
    const hasMinimumAudio = audioEvents.length >= minAudioChunks;

    // Only init if we have sufficient audio AND other events AND not currently playing
    if (hasMinimumAudio && hasNonAudioEvents && !isPlaying) {
      console.warn("AUDIO: Initializing audio with", audioEvents.length, "audio chunks");
      initAudio();
    }
    else {
      console.warn("AUDIO: Skipping initialization - audioEvents:", audioEvents.length, "minRequired:", minAudioChunks, "hasNonAudioEvents:", hasNonAudioEvents, "isPlaying:", isPlaying);
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
      // Find all events to determine proper timing
      const audioEvents = events.filter(e => e.kind === "audio-chunk" && e.time >= 0);
      const nonAudioEvents = events.filter(e => e.kind !== "audio-chunk" && e.time >= 0);

      if (audioEvents.length === 0) {
        console.warn("AUDIO: No audio events available for sync");
        return;
      }

      // Use the overall recording start (first event of any kind) as the baseline
      const allEvents = [...audioEvents, ...nonAudioEvents].sort((a, b) => a.time - b.time);
      const recordingStartTime = allEvents.length > 0 ? allEvents[0].time : 0;

      // The first audio chunk represents when audio recording actually began
      const audioStartTime = audioEvents[0].time;

      // Calculate how much audio should have played by now
      // If currentTime is before audioStartTime, audio should not play yet
      if (currentTime < audioStartTime) {
        // We're in the "pre-audio" phase of the recording
        if (!audio.paused) {
          console.warn("AUDIO: Pausing - playback is before audio starts. Current:", currentTime, "AudioStart:", audioStartTime);
          audio.pause();
        }
        return;
      }

      // Calculate audio time relative to when audio recording started
      const relativeAudioTime = currentTime - audioStartTime;
      const audioTime = relativeAudioTime / 1000; // Convert ms to seconds

      console.warn("Audio sync - currentTime:", currentTime, "recordingStart:", recordingStartTime, "audioStart:", audioStartTime, "relativeAudioTime:", relativeAudioTime, "audioTime:", audioTime, "duration:", audio.duration);

      // Only proceed if audio is ready to play and has duration
      if (audio.readyState >= 2 && !Number.isNaN(audio.duration) && audio.duration > 0 && audioTime >= 0) {
        // Only seek if time difference is significant (avoid constant seeking)
        const timeDiff = Math.abs(audio.currentTime - audioTime);
        if (timeDiff > 0.2) { // 200ms threshold to reduce jitter
          const targetTime = Math.min(Math.max(0, audioTime), audio.duration);
          console.warn("Audio seeking from", audio.currentTime, "to", targetTime, "diff:", timeDiff);
          try {
            audio.currentTime = targetTime;
          }
          catch (seekError) {
            console.warn("Audio seek failed:", seekError, "trying to seek to:", targetTime);
          }
        }

        // Play if not already playing
        if (audio.paused) {
          console.warn("Starting audio playback at time:", audioTime, "readyState:", audio.readyState, "duration:", audio.duration);
          audio.play().catch((error) => {
            console.error("Failed to play audio:", error, "readyState:", audio.readyState, "networkState:", audio.networkState);
          });
        }
      }
      else {
        console.warn("Audio not ready for playback:", {
          readyState: audio.readyState,
          networkState: audio.networkState,
          duration: audio.duration,
          durationValid: !Number.isNaN(audio.duration) && audio.duration > 0,
          src: `${audio.src.substring(0, 50)}...`,
        });
      }
    }
    else {
      // Pause audio when not playing
      if (!audio.paused) {
        console.warn("Pausing audio playback - shouldPlay is false");
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
