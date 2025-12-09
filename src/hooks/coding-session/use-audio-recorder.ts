"use client";

import { useCallback, useRef, useState } from "react";

export type AudioRecorderState = {
  isRecording: boolean;
  isSupported: boolean;
  error: string | null;
};

export type UseAudioRecorderOptions = {
  onAudioChunk?: (audioBlob: Blob, timestamp: number) => void;
  chunkInterval?: number; // milliseconds between chunks (default: 1000ms)
  mimeType?: string; // audio format (default: 'audio/webm')
};

/**
 * Hook for recording audio with timed chunks
 *
 * Records audio in chunks that can be synchronized with other events.
 * Each chunk has a precise timestamp for playback synchronization.
 */
export function useAudioRecorder({
  onAudioChunk,
  chunkInterval = 1000,
  mimeType = "audio/webm",
}: UseAudioRecorderOptions = {}) {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isSupported: typeof window !== "undefined" && "MediaRecorder" in window,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: "MediaRecorder not supported" }));
      return false;
    }

    try {
      console.warn("AUDIO: Requesting microphone access...");

      // Check if getUserMedia is available
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia not available");
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      console.warn("AUDIO: Microphone access granted, stream tracks:", stream.getAudioTracks().length);
      streamRef.current = stream;
      recordingStartTimeRef.current = Date.now();

      // Create MediaRecorder with specified format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle audio data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunk) {
          const timestamp = performance.now();
          onAudioChunk(event.data, timestamp);
        }
      };

      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setState(prev => ({
          ...prev,
          error: "Recording error occurred",
          isRecording: false,
        }));
      };

      // Start recording with time slicing for chunks
      mediaRecorder.start(chunkInterval);

      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
      }));

      return true;
    }
    catch (error) {
      console.warn("AUDIO: Failed to start recording:", error);
      let errorMessage = "Failed to start recording";

      if (error instanceof Error) {
        console.warn("AUDIO: Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        switch (error.name) {
          case "NotFoundError":
            errorMessage = "No microphone found. Check Chrome microphone permissions.";
            break;
          case "NotAllowedError":
            errorMessage = "Microphone blocked. Click the lock icon → Allow microphone.";
            break;
          case "NotReadableError":
            errorMessage = "Microphone busy. Close other apps using microphone.";
            break;
          case "AbortError":
            errorMessage = "Microphone access aborted. Try again.";
            break;
          case "NotSupportedError":
            errorMessage = "Microphone not supported in this browser.";
            break;
          default:
            errorMessage = `Microphone error: ${error.message}`;
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
      }));
      return false;
    }
  }, [state.isSupported, onAudioChunk, chunkInterval, mimeType]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      // Clear event handlers to prevent further chunks
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onerror = null;

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
    }));
  }, [state.isRecording]);

  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      stopRecording();
      return false;
    }
    else {
      return await startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
