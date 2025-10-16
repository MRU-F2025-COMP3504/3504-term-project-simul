"use client";

import { useEffect, useRef, useState } from "react";

import type { Section } from "~/types/playback";

import { Button } from "~/components/ui/button";

import CodePlayback from "./code-playback";

const mockSection: Section = {
  id: "example",
  videoUrl: "https://example.com/video.mp4",
  initialCode: "// recording demo\n\n",
  keystrokeEvents: [
    {
      timestamp: 1849,
      type: "insert",
      position: {
        line: 3,
        column: 1,
      },
      content: "H",
    },
    {
      timestamp: 1963,
      type: "insert",
      position: {
        line: 3,
        column: 2,
      },
      content: "e",
    },
    {
      timestamp: 2045,
      type: "insert",
      position: {
        line: 3,
        column: 3,
      },
      content: "y",
    },
    {
      timestamp: 2224,
      type: "insert",
      position: {
        line: 3,
        column: 4,
      },
      content: "!",
    },
    {
      timestamp: 2347,
      type: "insert",
      position: {
        line: 3,
        column: 5,
      },
      content: " ",
    },
    {
      timestamp: 2626,
      type: "insert",
      position: {
        line: 3,
        column: 6,
      },
      content: "T",
    },
    {
      timestamp: 2721,
      type: "insert",
      position: {
        line: 3,
        column: 7,
      },
      content: "h",
    },
    {
      timestamp: 2864,
      type: "insert",
      position: {
        line: 3,
        column: 8,
      },
      content: "i",
    },
    {
      timestamp: 2900,
      type: "insert",
      position: {
        line: 3,
        column: 9,
      },
      content: "s",
    },
    {
      timestamp: 2971,
      type: "insert",
      position: {
        line: 3,
        column: 10,
      },
      content: " ",
    },
    {
      timestamp: 3043,
      type: "insert",
      position: {
        line: 3,
        column: 11,
      },
      content: "i",
    },
    {
      timestamp: 3094,
      type: "insert",
      position: {
        line: 3,
        column: 12,
      },
      content: "s",
    },
    {
      timestamp: 3148,
      type: "insert",
      position: {
        line: 3,
        column: 13,
      },
      content: " ",
    },
    {
      timestamp: 3287,
      type: "insert",
      position: {
        line: 3,
        column: 14,
      },
      content: "a",
    },
    {
      timestamp: 3339,
      type: "insert",
      position: {
        line: 3,
        column: 15,
      },
      content: " ",
    },
    {
      timestamp: 3735,
      type: "insert",
      position: {
        line: 3,
        column: 16,
      },
      content: "t",
    },
    {
      timestamp: 3784,
      type: "insert",
      position: {
        line: 3,
        column: 17,
      },
      content: "e",
    },
    {
      timestamp: 3924,
      type: "insert",
      position: {
        line: 3,
        column: 18,
      },
      content: "s",
    },
    {
      timestamp: 3934,
      type: "insert",
      position: {
        line: 3,
        column: 19,
      },
      content: "t",
    },
    {
      timestamp: 4096,
      type: "insert",
      position: {
        line: 3,
        column: 20,
      },
      content: " ",
    },
    {
      timestamp: 4210,
      type: "insert",
      position: {
        line: 3,
        column: 21,
      },
      content: "o",
    },
    {
      timestamp: 4282,
      type: "insert",
      position: {
        line: 3,
        column: 22,
      },
      content: "f",
    },
    {
      timestamp: 4309,
      type: "insert",
      position: {
        line: 3,
        column: 23,
      },
      content: " ",
    },
    {
      timestamp: 4603,
      type: "insert",
      position: {
        line: 3,
        column: 24,
      },
      content: "m",
    },
    {
      timestamp: 4835,
      type: "insert",
      position: {
        line: 3,
        column: 25,
      },
      content: "y",
    },
    {
      timestamp: 4918,
      type: "insert",
      position: {
        line: 3,
        column: 26,
      },
      content: " ",
    },
    {
      timestamp: 5428,
      type: "insert",
      position: {
        line: 3,
        column: 27,
      },
      content: "r",
    },
    {
      timestamp: 5580,
      type: "insert",
      position: {
        line: 3,
        column: 28,
      },
      content: "e",
    },
    {
      timestamp: 5745,
      type: "insert",
      position: {
        line: 3,
        column: 29,
      },
      content: "c",
    },
    {
      timestamp: 5801,
      type: "insert",
      position: {
        line: 3,
        column: 30,
      },
      content: "o",
    },
    {
      timestamp: 5928,
      type: "insert",
      position: {
        line: 3,
        column: 31,
      },
      content: "r",
    },
    {
      timestamp: 6069,
      type: "insert",
      position: {
        line: 3,
        column: 32,
      },
      content: "d",
    },
    {
      timestamp: 6137,
      type: "insert",
      position: {
        line: 3,
        column: 33,
      },
      content: "i",
    },
    {
      timestamp: 6295,
      type: "insert",
      position: {
        line: 3,
        column: 34,
      },
      content: "g",
    },
    {
      timestamp: 6302,
      type: "insert",
      position: {
        line: 3,
        column: 35,
      },
      content: "n",
    },
    {
      timestamp: 6380,
      type: "insert",
      position: {
        line: 3,
        column: 36,
      },
      content: " ",
    },
    {
      timestamp: 6785,
      type: "insert",
      position: {
        line: 3,
        column: 37,
      },
      content: "d",
    },
    {
      timestamp: 6982,
      type: "delete",
      position: {
        line: 3,
        column: 37,
      },
      length: 1,
    },
    {
      timestamp: 7142,
      type: "delete",
      position: {
        line: 3,
        column: 36,
      },
      length: 1,
    },
    {
      timestamp: 7285,
      type: "delete",
      position: {
        line: 3,
        column: 35,
      },
      length: 1,
    },
    {
      timestamp: 7414,
      type: "delete",
      position: {
        line: 3,
        column: 34,
      },
      length: 1,
    },
    {
      timestamp: 7603,
      type: "insert",
      position: {
        line: 3,
        column: 34,
      },
      content: "n",
    },
    {
      timestamp: 7712,
      type: "insert",
      position: {
        line: 3,
        column: 35,
      },
      content: "g",
    },
    {
      timestamp: 7788,
      type: "insert",
      position: {
        line: 3,
        column: 36,
      },
      content: " ",
    },
    {
      timestamp: 7985,
      type: "insert",
      position: {
        line: 3,
        column: 37,
      },
      content: "d",
    },
    {
      timestamp: 8132,
      type: "insert",
      position: {
        line: 3,
        column: 38,
      },
      content: "e",
    },
    {
      timestamp: 8180,
      type: "insert",
      position: {
        line: 3,
        column: 39,
      },
      content: "m",
    },
    {
      timestamp: 8344,
      type: "insert",
      position: {
        line: 3,
        column: 40,
      },
      content: "o",
    },
    {
      timestamp: 8398,
      type: "insert",
      position: {
        line: 3,
        column: 41,
      },
      content: " ",
    },
    {
      timestamp: 8505,
      type: "delete",
      position: {
        line: 3,
        column: 41,
      },
      length: 1,
    },
    {
      timestamp: 8707,
      type: "insert",
      position: {
        line: 3,
        column: 41,
      },
      content: ".",
    },
    {
      timestamp: 9451,
      type: "insert",
      position: {
        line: 3,
        column: 42,
      },
      content: " ",
    },
    {
      timestamp: 9807,
      type: "insert",
      position: {
        line: 3,
        column: 43,
      },
      content: "G",
    },
    {
      timestamp: 9907,
      type: "insert",
      position: {
        line: 3,
        column: 44,
      },
      content: "o",
    },
    {
      timestamp: 10019,
      type: "insert",
      position: {
        line: 3,
        column: 45,
      },
      content: "d",
    },
    {
      timestamp: 10095,
      type: "insert",
      position: {
        line: 3,
        column: 46,
      },
      content: " ",
    },
    {
      timestamp: 10216,
      type: "insert",
      position: {
        line: 3,
        column: 47,
      },
      content: "i",
    },
    {
      timestamp: 10298,
      type: "insert",
      position: {
        line: 3,
        column: 48,
      },
      content: " ",
    },
    {
      timestamp: 10790,
      type: "insert",
      position: {
        line: 3,
        column: 49,
      },
      content: "h",
    },
    {
      timestamp: 10996,
      type: "insert",
      position: {
        line: 3,
        column: 50,
      },
      content: "o",
    },
    {
      timestamp: 11217,
      type: "insert",
      position: {
        line: 3,
        column: 51,
      },
      content: "p",
    },
    {
      timestamp: 11381,
      type: "insert",
      position: {
        line: 3,
        column: 52,
      },
      content: " ",
    },
    {
      timestamp: 11717,
      type: "delete",
      position: {
        line: 3,
        column: 52,
      },
      length: 1,
    },
    {
      timestamp: 11816,
      type: "insert",
      position: {
        line: 3,
        column: 52,
      },
      content: "e",
    },
    {
      timestamp: 11854,
      type: "insert",
      position: {
        line: 3,
        column: 53,
      },
      content: " ",
    },
    {
      timestamp: 12004,
      type: "insert",
      position: {
        line: 3,
        column: 54,
      },
      content: "t",
    },
    {
      timestamp: 12070,
      type: "insert",
      position: {
        line: 3,
        column: 55,
      },
      content: "h",
    },
    {
      timestamp: 12240,
      type: "insert",
      position: {
        line: 3,
        column: 56,
      },
      content: "i",
    },
    {
      timestamp: 12278,
      type: "insert",
      position: {
        line: 3,
        column: 57,
      },
      content: "s",
    },
    {
      timestamp: 12328,
      type: "insert",
      position: {
        line: 3,
        column: 58,
      },
      content: " ",
    },
    {
      timestamp: 12446,
      type: "insert",
      position: {
        line: 3,
        column: 59,
      },
      content: "w",
    },
    {
      timestamp: 12521,
      type: "insert",
      position: {
        line: 3,
        column: 60,
      },
      content: "o",
    },
    {
      timestamp: 12634,
      type: "insert",
      position: {
        line: 3,
        column: 61,
      },
      content: "r",
    },
    {
      timestamp: 12744,
      type: "insert",
      position: {
        line: 3,
        column: 62,
      },
      content: "k",
    },
    {
      timestamp: 12859,
      type: "insert",
      position: {
        line: 3,
        column: 63,
      },
      content: "s",
    },
    {
      timestamp: 12915,
      type: "insert",
      position: {
        line: 3,
        column: 64,
      },
      content: " ",
    },
    {
      timestamp: 12993,
      type: "delete",
      position: {
        line: 3,
        column: 64,
      },
      length: 1,
    },
    {
      timestamp: 13191,
      type: "insert",
      position: {
        line: 3,
        column: 64,
      },
      content: ".",
    },
    {
      timestamp: 14549,
      type: "delete",
      position: {
        line: 3,
        column: 47,
      },
      length: 1,
    },
    {
      timestamp: 14818,
      type: "insert",
      position: {
        line: 3,
        column: 47,
      },
      content: "I",
    },
  ],
  pausePoints: [],
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
