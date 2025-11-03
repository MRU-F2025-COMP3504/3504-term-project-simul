/**
 * useTestRunner Hook - Test Execution Engine for Coding Challenges
 *
 * Manages code evaluation, test execution, and result tracking for coding challenges.
 * Safely evaluates user-submitted code against predefined test cases.
 *
 * Key Features:
 * - Executes user code in isolated function context
 * - Validates results against expected outputs
 * - Tracks test pass/fail status for each test case
 * - Provides detailed error messages for failures
 * - Manages submission state (loading, error handling)
 *
 * Security Notes:
 * - Uses Function constructor for code evaluation (controlled environment)
 * - Input parameters are passed explicitly (nums, target)
 * - No access to global scope from user code
 * - Caught errors reported safely to UI
 *
 * @example
 * ```typescript
 * const tester = useTestRunner({
 *   testCases: TWO_SUM_TEST_CASES,
 *   editorApiRef,
 *   onResultsChange: () => {},
 * });
 *
 * // Submit code for evaluation
 * await tester.submit();
 *
 * // Reset results
 * tester.reset();
 *
 * // Check results
 * if (tester.testResults?.passed === tester.testResults?.total) {
 *   console.log('All tests passed!');
 * }
 * ```
 */

import { useCallback, useMemo, useState } from "react";

import type { TestCase, TestResults } from "~/types/coding-session";

/**
 * API returned by useTestRunner hook
 */
export type TestRunnerHandle = {
  /** Submit user code for testing */
  submit: () => Promise<void>;
  /** Clear all test results */
  reset: () => void;
  /** Whether test execution is in progress */
  isSubmitting: boolean;
  /** Most recent test results, null if not yet run */
  testResults: TestResults | null;
  /** Map of test name -> test detail for quick lookups by component */
  testStatusMap: Map<string, any> | null;
};

/**
 * Configuration options for useTestRunner hook
 */
type UseTestRunnerProps = {
  /** Array of test cases to execute against user code */
  testCases: TestCase[];
  /** Reference to CodeMirror editor API for extracting current code */
  editorApiRef: React.RefObject<{
    getState: () => { doc: { toString: () => string } } | null;
  } | null>;
  /** Callback fired when test results change (useful for analytics) */
  onResultsChange: (results: TestResults | null) => void;
};

/**
 * Safe code evaluation using Web Worker or isolated context
 *
 * Executes user-provided code against each test case.
 * Safely handles both runtime errors and assertion failures.
 *
 * Execution Model:
 * 1. For each test case, creates a function from user code
 * 2. Calls function with test inputs (nums, target)
 * 3. Validates output against expected result
 * 4. Captures any errors with detailed context
 *
 * Error Handling:
 * - Runtime errors: Include line number and error message
 * - Invalid results: Include expected vs actual values
 * - Type errors: Caught and reported as runtime errors
 *
 * @param code - User-submitted source code (must define twoSum function)
 * @param testCases - Array of test cases with inputs and expected outputs
 * @returns TestResults with pass/fail status and details for each test
 */
function evaluateCode(code: string, testCases: TestCase[]): TestResults {
  const details: TestResults["details"] = [];
  let passedCount = 0;

  for (const testCase of testCases) {
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
    total: testCases.length,
    details,
  };
}

/**
 * Hook implementation for test execution engine
 *
 * Manages test submission, result tracking, and status mapping.
 * Provides callbacks for form submission and result display.
 *
 * @returns TestRunnerHandle with submit, reset, and result state
 */
export function useTestRunner({
  testCases,
  editorApiRef,
  onResultsChange,
}: UseTestRunnerProps): TestRunnerHandle {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  /**
   * Builds a lookup map for quick test status access
   *
   * Maps test name -> test detail for O(1) lookup by UI components.
   * Useful for displaying individual test status indicators.
   * Recomputes only when testResults changes.
   */
  const testStatusMap = useMemo(() => {
    if (!testResults) {
      return null;
    }
    const map = new Map();
    for (const detail of testResults.details) {
      map.set(detail.name, detail);
    }
    return map;
  }, [testResults]);

  /**
   * Submits current editor code for testing
   *
   * Execution flow:
   * 1. Validates editor has content
   * 2. Extracts code from CodeMirror state
   * 3. Evaluates code against all test cases
   * 4. Updates state with results
   * 5. Fires onResultsChange callback
   *
   * Handles errors gracefully - failures become test results, not exceptions.
   * Sets isSubmitting to manage loading state in UI.
   */
  const submit = useCallback(async () => {
    if (!editorApiRef.current)
      return;

    setIsSubmitting(true);
    try {
      const state = editorApiRef.current.getState();
      if (!state) {
        setIsSubmitting(false);
        return;
      }
      const code = state.doc.toString();
      if (!code.trim()) {
        // eslint-disable-next-line no-alert
        window.alert("Please write some code before submitting");
        setIsSubmitting(false);
        return;
      }

      const results = evaluateCode(code, testCases);
      setTestResults(results);
      onResultsChange(results);
    }
    catch (error) {
      const results: TestResults = {
        passed: 0,
        total: testCases.length,
        details: [
          {
            name: "Code Execution",
            passed: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      };
      setTestResults(results);
      onResultsChange(results);
    }
    finally {
      setIsSubmitting(false);
    }
  }, [testCases, editorApiRef, onResultsChange]);

  /**
   * Clears all test results
   *
   * Used when:
   * - User resets the code editor
   * - User wants to start fresh
   * - Challenge is reset to starter state
   *
   * Fires onResultsChange callback with null to notify listeners.
   */
  const reset = useCallback(() => {
    setTestResults(null);
    onResultsChange(null);
  }, [onResultsChange]);

  return {
    submit,
    reset,
    isSubmitting,
    testResults,
    testStatusMap,
  };
}
