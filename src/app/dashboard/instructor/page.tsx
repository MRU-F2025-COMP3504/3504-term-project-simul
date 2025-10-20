"use client";
import type { ChangeSet } from "@codemirror/state";

import { javascript } from "@codemirror/lang-javascript";
import { EditorState, Transaction } from "@codemirror/state";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";

export default function CodeEditor() {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [recording, setRecording] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  function recordChanges(tr: Transaction) {
    if (recording) {
      if ((tr.annotation(Transaction.userEvent))) {
        setHistory(prev => [...prev, tr]);
      }
    }
  }
  const editor = useRef<HTMLDivElement>(null);

  const { view, setContainer } = useCodeMirror({
    container: editor.current,
    extensions: [
      javascript(),
      EditorState.transactionFilter.of((tr: Transaction) => {
        recordChanges(tr);
        return tr;
      }),
    ],
    basicSetup: {
      lineNumbers: true,
      highlightActiveLine: true,
      highlightActiveLineGutter: true,

    },
  });

  // Create a wrapping type for transactions. Store time and the transaction itself.
  const handlePlayback: () => Promise<void> = async () => {
    // eslint-disable-next-line no-unmodified-loop-condition
    while (isPlaying) {
      if (!view)
        return;
      // Match the state from the beginning of the recording
      view.setState(history[0].startState);

      for (let i = 0; i < history.length; i++) {
        const event: Transaction = history[i];
        const changes: ChangeSet = event.changes;
        if (changes) {
        // We must build a new transaction to apply the changes
        // When I didn't do this and just dispatched the old transaction,
        // The editor would not update correctly.
        // Could just be a skill issue.
          const tr: Transaction = view.state.update({ changes });
          view.dispatch(tr);
        }

        // Check if the event is the last one
        if (i === history.length - 1) {
          break;
        }
        const nextEvent: Transaction = history[i + 1];
        // Guard me
        if (!nextEvent) {
          break;
        }
        // Calculate me
        const delay = (nextEvent?.annotation(Transaction?.time) ?? 0) - (event?.annotation(Transaction.time) ?? 0);

        // Delay me
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    handlePlayback();
  };

  const calculatePlaybackTime = () => {
    // compare first and last event timestamps
    if (history.length < 2) {
      return 0;
    }
    const firstEvent: Transaction = history[0];
    const lastEvent: Transaction = history[history.length - 1];
    const playbackTime = (lastEvent.annotation(Transaction.time) ?? 0) - (firstEvent.annotation(Transaction.time) ?? 0);
    setPlaybackTime(playbackTime);
  };

  const formatDisplayTime = (timeInMs: number) => {
    const parsedSeconds = Math.floor((timeInMs / 1000) % 60);
    const parsedMinutes = Math.floor((timeInMs / (1000 * 60)) % 60);
    const parsedHours = Math.floor((timeInMs / (1000 * 60 * 60)) % 24);
    let formattedSeconds = "";
    let formattedMinutes = "";
    let formattedHours = "";

    if (parsedSeconds < 10) {
      formattedSeconds = `0${parsedSeconds}`;
    }
    else {
      formattedSeconds = `${parsedSeconds}`;
    }
    if (parsedMinutes < 10) {
      formattedMinutes = `0${parsedMinutes}`;
    }
    else {
      formattedMinutes = `${parsedMinutes}`;
    }
    if (parsedHours < 10) {
      formattedHours = `0${parsedHours}`;
    }
    else {
      formattedHours = `${parsedHours}`;
    }

    if (parsedHours === 0) {
      return `${formattedMinutes}:${formattedSeconds}`;
    }

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const toggleRecording = async () => {
    setRecording(!recording);
    calculatePlaybackTime();
  };

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.current]);
  return (
    <>
      <Button onClick={toggleRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </Button>
      <Button onClick={togglePlayback}> play </Button>
      <div>
        Playback time:
        {formatDisplayTime(playbackTime)}
      </div>
      <div ref={editor} />

    </>
  );
}
