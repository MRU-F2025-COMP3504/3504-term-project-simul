"use client";

import { useEffect, useRef, useState } from "react";

import CodePlayback from "./code-playback";
import { Button } from "./ui/button";

const mockSection = {
  id: "demo-1",
  videoUrl: "https://example.com/video.mp4",
  initialCode: "// Start here\n",
  keystrokeEvents: [
    {
      timestamp: 1000,
      type: "insert" as const,
      position: { line: 2, column: 1 },
      content: "function twoSum(nums, target) {",
    },
    {
      timestamp: 2000,
      type: "insert" as const,
      position: { line: 2, column: 33 },
      content: "\n",
    },
    {
      timestamp: 3000,
      type: "insert" as const,
      position: { line: 3, column: 1 },
      content: "  const map = new Map();",
    },
    {
      timestamp: 4000,
      type: "insert" as const,
      position: { line: 3, column: 26 },
      content: "\n",
    },
    {
      timestamp: 5000,
      type: "insert" as const,
      position: { line: 4, column: 1 },
      content: "  for (let i = 0; i < nums.length; i++) {",
    },
    {
      timestamp: 6000,
      type: "insert" as const,
      position: { line: 4, column: 43 },
      content: "\n",
    },
    {
      timestamp: 7000,
      type: "insert" as const,
      position: { line: 5, column: 1 },
      content: "    const complement = target - nums[i];",
    },
    {
      timestamp: 8000,
      type: "insert" as const,
      position: { line: 5, column: 45 },
      content: "\n",
    },
    {
      timestamp: 9000,
      type: "insert" as const,
      position: { line: 6, column: 1 },
      content: "    if (map.has(complement)) {",
    },
    {
      timestamp: 10000,
      type: "insert" as const,
      position: { line: 6, column: 35 },
      content: "\n",
    },
    {
      timestamp: 11000,
      type: "insert" as const,
      position: { line: 7, column: 1 },
      content: "      return [map.get(complement), i];",
    },
    {
      timestamp: 12000,
      type: "insert" as const,
      position: { line: 7, column: 43 },
      content: "\n    }\n",
    },
    {
      timestamp: 13000,
      type: "insert" as const,
      position: { line: 9, column: 1 },
      content: "    map.set(nums[i], i);",
    },
    {
      timestamp: 14000,
      type: "insert" as const,
      position: { line: 9, column: 25 },
      content: "\n  }\n}",
    },
  ],
  pausePoints: [5000, 10000],
};

export default function CodePlaybackDemo() {
  const [videoTimeInMS, setVideoTimeInMS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const UPDATE_RATE = 100; // ms

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startPlayback = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPlaying(true);
    startTimeRef.current = Date.now() - videoTimeInMS; // handle current position

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= 15000) {
        setVideoTimeInMS(15000);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsPlaying(false);
      }
      else {
        setVideoTimeInMS(elapsed);
      }
    }, UPDATE_RATE);
  };

  const stopPlayback = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  };

  const jumpTo = (time: number) => {
    setVideoTimeInMS(time);

    if (isPlaying) {
      startTimeRef.current = Date.now() - time;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center gap-4">
          <Button onClick={startPlayback} disabled={isPlaying}>
            {isPlaying ? "Playing..." : "Start Playback"}
          </Button>
          <Button onClick={stopPlayback} variant="outline" disabled={!isPlaying}>
            Stop
          </Button>
        </div>

        <div className="mb-4">
          <div className="text-muted-foreground mb-2 text-sm">
            Current Time:
            {" "}
            {(videoTimeInMS / 1000).toFixed(1)}
            s
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            value={videoTimeInMS}
            onChange={e => jumpTo(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => jumpTo(0)} variant="outline" size="sm">
            0s
          </Button>
          <Button onClick={() => jumpTo(5000)} variant="outline" size="sm">
            5s
          </Button>
          <Button onClick={() => jumpTo(10000)} variant="outline" size="sm">
            10s
          </Button>
          <Button onClick={() => jumpTo(15000)} variant="outline" size="sm">
            15s
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <CodePlayback section={mockSection} videoTimeInMS={videoTimeInMS} />
      </div>
    </div>
  );
}
