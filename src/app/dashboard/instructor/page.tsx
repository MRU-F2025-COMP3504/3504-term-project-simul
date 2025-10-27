"use client";
import type { ChangeSet, EditorState as CMEditorState } from "@codemirror/state";
import type { MouseEvent } from "react";

import { javascript } from "@codemirror/lang-javascript";
import { EditorSelection, EditorState, Transaction } from "@codemirror/state";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef, useState } from "react";

import type { FileEntry, RecordedEvent, TestResults } from "~/types/coding-session";

import { Button } from "~/components/ui/button";
import { TWO_SUM_STARTER_CODE, TWO_SUM_TEST_CASES } from "~/lib/coding-session/tests/two-sum";
import { formatDisplayTime } from "~/lib/coding-session/time";

export default function CodeEditor() {
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [recording, setRecording] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const starterCode = TWO_SUM_STARTER_CODE;
  const TEST_CASES = TWO_SUM_TEST_CASES;

  // Multi-file support
  const [files, setFiles] = useState<Map<string, FileEntry>>(() => new Map([["main.js", { name: "main.js", content: starterCode }]]));
  const [activeFile, setActiveFile] = useState("main.js");
  const initialStateRef = useRef<CMEditorState | null>(null);
  const initialFilesRef = useRef<Map<string, FileEntry> | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const editor = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(false);

  function recordChanges(tr: Transaction) {
    if (!recording)
      return;
    // Only record user-driven transactions
    if (tr.annotation(Transaction.userEvent)) {
      let time = tr.annotation(Transaction.time) ?? Date.now();
      // Convert to relative time from start of recording
      if (recordingStartTimeRef.current) {
        time = time - recordingStartTimeRef.current;
      }
      // Extract selection range from the transaction's state
      const selection = tr.selection ? { anchor: tr.selection.main.anchor, head: tr.selection.main.head } : undefined;
      setRecordedEvents(prev => [...prev, { time, kind: "transaction", fileName: activeFile, transaction: tr, selection }]);
      setTestResults(prev => (prev ? null : prev));
    }
  }

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

  const handlePlayback: () => Promise<void> = async () => {
    if (!view)
      return;
    if (!recordedEvents || recordedEvents.length === 0)
      return;

    // Reset editor state to the initial state captured when recording began
    if (initialStateRef.current) {
      view.setState(initialStateRef.current);
    }

    // Show cursor overlay
    if (cursorRef.current) {
      cursorRef.current.style.display = "block";
    }

    const playbackStartTime = Date.now();
    const recordingStartTime = recordedEvents[0]?.time ?? 0;

    // Start a timer to continuously update playback time
    const timerInterval = setInterval(() => {
      if (!playingRef.current) {
        clearInterval(timerInterval);
        return;
      }
      const elapsedTime = Date.now() - playbackStartTime;
      const newPlaybackTime = recordingStartTime + elapsedTime;
      setPlaybackTime(newPlaybackTime);
    }, 50); // Update every 50ms for smooth progress

    let eventIndex = 0;

    while (eventIndex < recordedEvents.length && playingRef.current) {
      const event = recordedEvents[eventIndex];
      const nextEvent = eventIndex < recordedEvents.length - 1 ? recordedEvents[eventIndex + 1] : null;
      const delayToNextEvent = nextEvent ? Math.max(0, (nextEvent.time ?? 0) - (event.time ?? 0)) : 0;

      // Wait for the delay to the next event
      if (delayToNextEvent > 0) {
        await new Promise(resolve => setTimeout(resolve, delayToNextEvent));
      }

      // Check if playback was stopped
      if (!playingRef.current) {
        break;
      }

      // Process current event
      if (event.kind === "transaction" && event.transaction && event.transaction.changes) {
        const changes: ChangeSet = event.transaction.changes;
        const tr: Transaction = view.state.update({ changes });
        view.dispatch(tr);

        // Apply selection range if recorded
        if (event.selection) {
          const selectionTr = view.state.update({
            selection: EditorSelection.single(event.selection.anchor, event.selection.head),
          });
          view.dispatch(selectionTr);
        }
      }

      if (event.kind === "file-switch" && event.fileName) {
        // Switch to the file during playback
        const fileEntry = files.get(event.fileName);
        if (fileEntry) {
          view.setState(EditorState.create({ doc: fileEntry.content, extensions: [javascript()] }));
        }
      }

      if (event.kind === "file-create") {
        // File was created during recording (for informational purposes during playback)
        const fileName = event.fileName ?? "";
        const newFile: FileEntry = { name: fileName, content: event.fileContent ?? "" };
        if (fileName) {
          setFiles((prev) => {
            const newMap = new Map(prev);
            newMap.set(fileName, newFile);
            return newMap;
          });
        }
      }

      if (event.kind === "mouse" && event.mouse && cursorRef.current) {
        // Position cursor according to recorded coordinates (we store coords relative to editor rect)
        // Use left/top and keep the translate(-50%,-50%) so the dot centers on the point.
        cursorRef.current.style.left = `${event.mouse.x}px`;
        cursorRef.current.style.top = `${event.mouse.y}px`;
      }

      eventIndex++;
    }

    // Clear the timer when playback ends
    clearInterval(timerInterval);

    // Hide cursor overlay when playback ends
    if (cursorRef.current) {
      cursorRef.current.style.display = "none";
    }

    // Stop playing flag
    playingRef.current = false;
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      playingRef.current = true;
      setIsPlaying(true);
      void handlePlayback();
    }
    else {
      playingRef.current = false;
      setIsPlaying(false);
    }
  };

  const calculatePlaybackTime = () => {
    if (recordedEvents.length < 2) {
      setPlaybackTime(0);
      return 0;
    }
    const firstEvent = recordedEvents[0];
    const lastEvent = recordedEvents[recordedEvents.length - 1];
    const playback = (lastEvent.time ?? 0) - (firstEvent.time ?? 0);
    setPlaybackTime(playback);
    return playback;
  };

  // Record a file switch
  const switchFile = (fileName: string) => {
    if (activeFile === fileName || !view)
      return;

    // Save current file content before switching
    const currentContent = view.state.doc.toString();
    setFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeFile, { name: activeFile, content: currentContent });
      return newMap;
    });

    // Switch to new file
    setActiveFile(fileName);

    // Update editor with new file content
    const fileEntry = files.get(fileName);
    if (fileEntry) {
      view.setState(EditorState.create({ doc: fileEntry.content, extensions: [javascript()] }));
    }

    // Record file switch if recording
    if (recording) {
      let time = Date.now();
      // Convert to relative time from start of recording
      if (recordingStartTimeRef.current) {
        time = time - recordingStartTimeRef.current;
      }
      setRecordedEvents(prev => [...prev, { time, kind: "file-switch", fileName }]);
    }
  };

  // Create a new file
  const createNewFile = (fileName: string) => {
    if (files.has(fileName))
      return;

    const newFile: FileEntry = { name: fileName, content: "" };
    setFiles(prev => new Map(prev).set(fileName, newFile));

    if (recording) {
      let time = Date.now();
      // Convert to relative time from start of recording
      if (recordingStartTimeRef.current) {
        time = time - recordingStartTimeRef.current;
      }
      setRecordedEvents(prev => [...prev, { time, kind: "file-create", fileName, fileContent: "" }]);
    }
  };

  // record mouse events using event listeners
  const recordMouseEvents = (event: MouseEvent<HTMLDivElement>) => {
    if (!recording)
      return;
    if (!editor.current)
      return;
    const rect = editor.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let time = Date.now();
    // Convert to relative time from start of recording
    if (recordingStartTimeRef.current) {
      time = time - recordingStartTimeRef.current;
    }
    setRecordedEvents(prev => [...prev, { time, kind: "mouse", mouse: { x, y, type: event.type, button: (event as any).button } }]);
  };

  const toggleRecording = async () => {
    if (!recording) {
      // starting recording
      recordingStartTimeRef.current = Date.now();
      initialStateRef.current = view?.state ?? null;
      initialFilesRef.current = new Map(files);
      setRecordedEvents([]);
      setPlaybackTime(0);
      setRecording(true);
    }
    else {
      // stopping recording
      // Save current file content before stopping
      if (view) {
        const currentContent = view.state.doc.toString();
        setFiles((prev) => {
          const newMap = new Map(prev);
          newMap.set(activeFile, { name: activeFile, content: currentContent });
          return newMap;
        });
      }
      setRecording(false);
      calculatePlaybackTime();
    }
  };

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.current]);

  useEffect(() => {
    if (!view) {
      return;
    }
    const currentDoc = view.state.doc.toString();
    if (currentDoc.length > 0) {
      return;
    }
    const activeFileEntry = files.get(activeFile);
    if (!activeFileEntry) {
      return;
    }
    view.dispatch({
      changes: {
        from: 0,
        to: currentDoc.length,
        insert: activeFileEntry.content,
      },
    });
  }, [view, files, activeFile]);

  // Safe code evaluation using Web Worker or isolated context
  const evaluateCode = async (code: string): Promise<TestResults> => {
    const details: TestResults["details"] = [];
    let passedCount = 0;

    for (const testCase of TEST_CASES) {
      try {
        // Create a safe execution context
        // eslint-disable-next-line no-new-func
        const userFunction = new Function("nums", "target", code);
        const result = userFunction(testCase.input.nums, testCase.input.target);

        // Validate the result
        const expected = [...testCase.expected].sort((a, b) => a - b);
        const actual = Array.isArray(result) ? [...result].sort((a, b) => a - b) : null;

        if (!actual || actual.length !== 2 || actual[0] !== expected[0] || actual[1] !== expected[1]) {
          const failureMessage = `Input nums=${JSON.stringify(testCase.input.nums)} | target=${testCase.input.target} | Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
          details.push({
            name: testCase.name,
            passed: false,
            error: failureMessage,
          });
        }
        else {
          details.push({
            name: testCase.name,
            passed: true,
          });
          passedCount += 1;
        }
      }
      catch (error) {
        const runtimeMessage = `Input nums=${JSON.stringify(testCase.input.nums)} | target=${testCase.input.target} | ${error instanceof Error ? error.message : String(error)}`;
        details.push({
          name: testCase.name,
          passed: false,
          error: runtimeMessage,
        });
      }
    }

    return {
      passed: passedCount,
      total: TEST_CASES.length,
      details,
    };
  };

  const testStatusMap = useMemo(() => {
    if (!testResults) {
      return null;
    }
    const map = new Map<string, { passed: boolean; error?: string }>();
    for (const detail of testResults.details) {
      map.set(detail.name, detail);
    }
    return map;
  }, [testResults]);

  const handleSubmit = async () => {
    if (!view)
      return;

    setIsSubmitting(true);
    try {
      const code = view.state.doc.toString();
      if (!code.trim()) {
        // eslint-disable-next-line no-alert
        window.alert("Please write some code before submitting");
        setIsSubmitting(false);
        return;
      }

      const results = await evaluateCode(code);
      setTestResults(results);
    }
    catch (error) {
      setTestResults({
        passed: 0,
        total: 4,
        details: [
          {
            name: "Code Execution",
            passed: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const resetToStarter = () => {
    if (!view)
      return;

    const docLength = view.state.doc.length;
    view.dispatch({
      changes: {
        from: 0,
        to: docLength,
        insert: starterCode,
      },
    });

    setFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeFile, { name: activeFile, content: starterCode });
      return newMap;
    });

    setTestResults(null);
  };

  const totalTests = TEST_CASES.length;
  const testsPassed = testResults?.passed ?? 0;
  const allTestsPassed = Boolean(testResults) && testsPassed === totalTests;

  return (
    <div onMouseMove={recordMouseEvents} style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top control bar */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #e0e0e0", backgroundColor: "#f5f5f5" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Button onClick={toggleRecording}>
            {recording ? "Stop Recording" : "Start Recording"}
          </Button>
          <Button onClick={togglePlayback}>
            {isPlaying ? "Stop" : "Play"}
          </Button>
          <div style={{ marginLeft: "1rem", fontSize: "0.9rem", color: "#666" }}>
            Playback time:
            {" "}
            {formatDisplayTime(playbackTime)}
          </div>
        </div>
      </div>

      {/* Main content area: sidebar + editor */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar: File explorer */}
        <div style={{
          width: "250px",
          borderRight: "1px solid #e0e0e0",
          backgroundColor: "#f9f9f9",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        >
          {/* File explorer header */}
          <div style={{
            padding: "1rem",
            borderBottom: "1px solid #e0e0e0",
            fontWeight: "bold",
            fontSize: "0.9rem",
            color: "#333",
            textTransform: "uppercase",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          >
            <span>Files</span>
            <Button
              onClick={() => {
                const newFileName = `file${files.size + 1}.js`;
                createNewFile(newFileName);
                switchFile(newFileName);
              }}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            >
              +
            </Button>
          </div>

          {/* File tree */}
          <div style={{
            flex: 1,
            overflow: "auto",
            padding: "0.5rem 0",
          }}
          >
            {Array.from(files.keys()).map(fileName => (
              <div
                key={fileName}
                onClick={() => switchFile(fileName)}
                style={{
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  backgroundColor: activeFile === fileName ? "#e3f2fd" : "transparent",
                  color: activeFile === fileName ? "#007bff" : "#333",
                  borderLeft: activeFile === fileName ? "3px solid #007bff" : "3px solid transparent",
                  fontSize: "0.9rem",
                  userSelect: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (activeFile !== fileName) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f0f0f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFile !== fileName) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                  }
                }}
              >
                📄
                {" "}
                {fileName}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor and tabs */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* File tabs */}
          <div style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#fafafa",
            padding: "0.5rem 0.5rem 0 0.5rem",
            overflowX: "auto",
          }}
          >
            {Array.from(files.keys()).map(fileName => (
              <button
                key={fileName}
                type="button"
                onClick={() => switchFile(fileName)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: activeFile === fileName ? "white" : "#f0f0f0",
                  color: "#333",
                  border: activeFile === fileName ? "1px solid #e0e0e0" : "1px solid #d0d0d0",
                  borderBottom: activeFile === fileName ? "none" : "1px solid #d0d0d0",
                  borderRadius: "4px 4px 0 0",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e8e8e8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = activeFile === fileName ? "white" : "#f0f0f0";
                }}
              >
                {fileName}
              </button>
            ))}
          </div>

          {/* Editor container: relative so we can position the playback cursor over it */}
          <div ref={editor} style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            {/* Cursor overlay */}
            <div
              ref={cursorRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 10,
                height: 10,
                background: "rgba(0,120,212,0.9)",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                display: "none",
                pointerEvents: "none",
                zIndex: 2000,
              }}
            />
          </div>
        </div>

        {/* Right side: Problem panel */}
        <div style={{
          width: "300px",
          borderLeft: "1px solid #e0e0e0",
          backgroundColor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        >
          {/* Problem header */}
          <div style={{
            padding: "1rem",
            borderBottom: "1px solid #e0e0e0",
            fontWeight: "bold",
            fontSize: "0.9rem",
            color: "#333",
            textTransform: "uppercase",
          }}
          >
            Problem
          </div>

          {/* Problem content */}
          <div style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem",
            fontSize: "0.85rem",
            lineHeight: "1.6",
          }}
          >
            {/* Actions and guidance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    flex: "1 1 160px",
                    padding: "0.75rem",
                    backgroundColor: isSubmitting ? "#ccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    transition: "background-color 0.2s",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Code"}
                </Button>
                <button
                  type="button"
                  onClick={resetToStarter}
                  style={{
                    flex: "1 1 140px",
                    padding: "0.75rem",
                    backgroundColor: "white",
                    color: "#333",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    transition: "border-color 0.2s, color 0.2s, background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#007bff";
                    (e.currentTarget as HTMLButtonElement).style.color = "#007bff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#d0d0d0";
                    (e.currentTarget as HTMLButtonElement).style.color = "#333";
                  }}
                >
                  Reset to Starter
                </button>
              </div>

              <div style={{
                backgroundColor: "#fff8e1",
                border: "1px solid #ffe0a3",
                borderRadius: "4px",
                padding: "0.85rem",
                color: "#8c6d1f",
              }}
              >
                <strong style={{ display: "block", marginBottom: "0.35rem" }}>Workflow</strong>
                <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem" }}>
                  <li style={{ marginBottom: "0.35rem" }}>Review the prompt and note the starter function signature.</li>
                  <li style={{ marginBottom: "0.35rem" }}>Write your solution in the editor; edits clear prior results automatically.</li>
                  <li>Submit to run the test suite and inspect the per-case feedback below.</li>
                </ol>
              </div>
            </div>

            {/* Test summary */}
            <div style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              borderRadius: "4px",
              backgroundColor: allTestsPassed ? "#d4edda" : testResults ? "#f8d7da" : "#eef2ff",
              border: `1px solid ${allTestsPassed ? "#c3e6cb" : testResults ? "#f5c6cb" : "#d6dcff"}`,
              color: allTestsPassed ? "#155724" : testResults ? "#721c24" : "#2f3a63",
            }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                {testResults ? (allTestsPassed ? "✓ All Tests Passed" : "✗ Tests Failed") : "Automated Feedback"}
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                {testsPassed}
                {" / "}
                {totalTests}
                {" "}
                tests passed
              </div>
              {!testResults && (
                <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
                  Submit your code to run all test cases.
                </div>
              )}
            </div>

            {/* Test suite details */}
            <div style={{ marginBottom: "1.5rem" }}>
              <strong style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}>Test Suite</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {TEST_CASES.map((testCase) => {
                  const detail = testStatusMap?.get(testCase.name);
                  const isPending = !testResults;
                  const isPassed = detail?.passed;
                  const statusLabel = isPending ? "Pending" : isPassed ? "Passed" : "Failed";
                  const badgeColor = isPending ? "#555" : isPassed ? "#155724" : "#b0413e";
                  const badgeBackground = isPending ? "#e0e0e0" : isPassed ? "#d4edda" : "#f8d7da";
                  const cardBorder = isPending ? "#e0e0e0" : isPassed ? "#c3e6cb" : "#f5c6cb";
                  const cardBackground = isPending ? "white" : isPassed ? "#f9fffa" : "#fff5f5";

                  return (
                    <div
                      key={testCase.name}
                      style={{
                        border: `1px solid ${cardBorder}`,
                        borderRadius: "4px",
                        padding: "0.75rem",
                        backgroundColor: cardBackground,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, color: "#333" }}>{testCase.name}</span>
                        <span style={{
                          fontSize: "0.7rem",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "999px",
                          backgroundColor: badgeBackground,
                          color: badgeColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.4rem" }}>
                        {testCase.description}
                      </div>
                      <div style={{ fontSize: "0.75rem", marginTop: "0.4rem", fontFamily: "monospace", color: "#666" }}>
                        nums =
                        {" "}
                        {JSON.stringify(testCase.input.nums)}
                        , target =
                        {" "}
                        {testCase.input.target}
                      </div>
                      {detail && detail.error && (
                        <div style={{ fontSize: "0.75rem", marginTop: "0.45rem", color: "#b0413e" }}>
                          {detail.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Problem title */}
            <h3 style={{ margin: "0 0 0.75rem 0", color: "#007bff", fontSize: "1rem" }}>
              Two Sum
            </h3>

            {/* Problem description */}
            <div style={{ marginBottom: "1rem" }}>
              <strong>Description:</strong>
              <p style={{ margin: "0.5rem 0", color: "#555" }}>
                Given an array of integers
                {" "}
                <code>nums</code>
                {" "}
                and an integer
                {" "}
                <code>target</code>
                , return the indices of the two numbers that add up to the target.
              </p>
              <p style={{ margin: "0.5rem 0", color: "#555" }}>
                You may assume that each input has exactly one solution, and you may not use the same element twice.
              </p>
              <p style={{ margin: "0.5rem 0", color: "#555" }}>
                You can return the answer in any order.
              </p>
            </div>

            {/* Example 1 */}
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
              <strong style={{ color: "#333" }}>Example 1:</strong>
              <div style={{ margin: "0.5rem 0", fontFamily: "monospace", color: "#555" }}>
                <div>Input: nums = [2,7,11,15], target = 9</div>
                <div>Output: [0,1]</div>
                <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                  Explanation: nums[0] + nums[1] = 2 + 7 = 9
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
              <strong style={{ color: "#333" }}>Example 2:</strong>
              <div style={{ margin: "0.5rem 0", fontFamily: "monospace", color: "#555" }}>
                <div>Input: nums = [3,2,4], target = 6</div>
                <div>Output: [1,2]</div>
                <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                  Explanation: nums[1] + nums[2] = 2 + 4 = 6
                </div>
              </div>
            </div>

            {/* Example 3 */}
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
              <strong style={{ color: "#333" }}>Example 3:</strong>
              <div style={{ margin: "0.5rem 0", fontFamily: "monospace", color: "#555" }}>
                <div>Input: nums = [3,3], target = 6</div>
                <div>Output: [0,1]</div>
              </div>
            </div>

            {/* Constraints */}
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
              <strong style={{ color: "#333" }}>Constraints:</strong>
              <ul style={{ margin: "0.5rem 0 0 1.25rem", paddingLeft: 0, color: "#555" }}>
                <li>2 ≤ nums.length ≤ 10⁴</li>
                <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                <li>-10⁹ ≤ target ≤ 10⁹</li>
                <li>Only one valid answer exists.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Video-style playback bar at bottom */}
      <div style={{
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#2d2d2d",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
      >
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlayback}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: isPlaying ? "#ff6b6b" : "#007bff",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = isPlaying ? "#ff5252" : "#0056b3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = isPlaying ? "#ff6b6b" : "#007bff";
          }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Current time / Total time */}
        <div style={{ color: "#fff", fontSize: "0.85rem", minWidth: "80px" }}>
          {formatDisplayTime(recordedEvents.length > 0 ? playbackTime : 0)}
          {" / "}
          {formatDisplayTime(recordedEvents.length > 0 ? Math.max(...recordedEvents.map(e => e.time), 0) : 0)}
        </div>

        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max={recordedEvents.length > 0 ? Math.max(...recordedEvents.map(e => e.time), 1) : 0}
          value={playbackTime}
          onChange={(e) => {
            if (!isPlaying) {
              setPlaybackTime(Number(e.target.value));
            }
          }}
          style={{
            flex: 1,
            height: "6px",
            borderRadius: "3px",
            border: "none",
            background: `linear-gradient(to right, #007bff 0%, #007bff ${recordedEvents.length > 0 ? (playbackTime / Math.max(...recordedEvents.map(e => e.time), 1)) * 100 : 0}%, #555 ${recordedEvents.length > 0 ? (playbackTime / Math.max(...recordedEvents.map(e => e.time), 1)) * 100 : 0}%, #555 100%)`,
            outline: "none",
            cursor: recordedEvents.length > 0 ? "pointer" : "default",
          }}
        />

        {/* Recording indicator */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {recording && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#ff4444",
                animation: "pulse 1s infinite",
              }}
              />
              <span style={{ color: "#ff4444", fontSize: "0.85rem" }}>Recording</span>
            </div>
          )}
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>
        {`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #007bff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
        }
        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          background: #555;
          border-radius: 3px;
        }
        input[type="range"]::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}
      </style>
    </div>
  );
}
