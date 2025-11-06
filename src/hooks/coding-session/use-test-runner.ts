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

import { executeWithTests } from "~/actions/piston-actions";

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
  /** Name of the function to test (e.g., "twoSum") */
  functionName: string;
  /** Function to convert test input to array of function arguments in correct order */
  renderTestArgs: (input: any) => any[];
  /** Reference to CodeMirror editor API for extracting current code */
  editorApiRef: React.RefObject<{
    getState: () => { doc: { toString: () => string } } | null;
  } | null>;
  /** Callback fired when test results change (useful for analytics) */
  onResultsChange: (results: TestResults | null) => void;
};

/**
 * Safe code evaluation using Piston
 *
 * Executes user-provided code against each test case using Piston API.
 * Safely handles both runtime errors and assertion failures.
 *
 * Execution Model:
 * 1. Sends code and test cases to Piston server action
 * 2. Piston executes code in sandboxed environment
 * 3. Returns structured test results
 *
 * Error Handling:
 * - Runtime errors: Include error message from Piston
 * - Invalid results: Include expected vs actual values
 * - Network errors: Caught and reported as execution errors
 *
 * @param code - User-submitted source code
 * @param testCases - Array of test cases with inputs and expected outputs
 * @param functionName - Name of the function to test
 * @param renderTestArgs - Function to convert input object to array of arguments
 * @returns Promise<TestResults> with pass/fail status and details for each test
 */
async function evaluateCode(
  code: string,
  testCases: TestCase[],
  functionName: string,
  renderTestArgs: (input: any) => any[],
): Promise<TestResults> {
  try {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      functionName,
      files: [
        {
          name: "main.js",
          content: code,
        },
      ],
      testCases: testCases.map(tc => ({
        name: tc.name,
        // Use renderTestArgs to convert input to function arguments in correct order
        // This avoids fragile Object.values() approach that depends on property order
        input: renderTestArgs(tc.input),
        expected: tc.expected,
      })),
    });

    if (!result?.data?.success || !result.data.results) {
      // Execution failed
      return {
        passed: 0,
        total: testCases.length,
        details: testCases.map(tc => ({
          name: tc.name,
          passed: false,
          error: result?.data?.error || "Code execution failed",
        })),
      };
    }

    return result.data.results;
  }
  catch (error) {
    // Network or other error
    return {
      passed: 0,
      total: testCases.length,
      details: testCases.map(tc => ({
        name: tc.name,
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })),
    };
  }
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
  functionName,
  renderTestArgs,
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

      const results = await evaluateCode(code, testCases, functionName, renderTestArgs);
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
  }, [testCases, functionName, renderTestArgs, editorApiRef, onResultsChange]);

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
