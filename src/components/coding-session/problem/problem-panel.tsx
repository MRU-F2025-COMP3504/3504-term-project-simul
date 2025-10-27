import type { TestCase, TestDetail, TestResults } from "~/types/coding-session";

import { Button } from "~/components/ui/button";

import { TestList } from "./test-list";
import { TestSummary } from "./test-summary";

export type ProblemPanelProps = {
  testResults: TestResults | null;
  testCases: TestCase[];
  testStatusMap: Map<string, TestDetail> | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onReset: () => void;
};

export function ProblemPanel({
  testResults,
  testCases,
  testStatusMap,
  isSubmitting,
  onSubmit,
  onReset,
}: ProblemPanelProps) {
  const totalTests = testCases.length;
  const testsPassed = testResults?.passed ?? 0;
  const allTestsPassed = Boolean(testResults) && testsPassed === totalTests;

  return (
    <div className={`
      flex w-[300px] flex-col overflow-hidden border-l bg-neutral-50
    `}
    >
      {/* Problem header */}
      <div className="border-b p-4 text-sm font-bold text-neutral-700 uppercase">
        Problem
      </div>

      {/* Problem content */}
      <div className="flex-1 overflow-auto p-4 text-[0.85rem] leading-relaxed">
        {/* Actions and guidance */}
        <div className="mb-6 flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className={`
                flex-[1_1_160px] rounded border-none px-3 py-3 text-sm font-bold
                transition-colors
                ${isSubmitting
      ? `cursor-not-allowed bg-neutral-300 text-neutral-600`
      : `
        cursor-pointer bg-green-600 text-white
        hover:bg-green-700
      `}
              `}
            >
              {isSubmitting ? "Submitting..." : "Submit Code"}
            </Button>
            <button
              type="button"
              onClick={onReset}
              className={`
                flex-[1_1_140px] cursor-pointer rounded border
                border-neutral-300 bg-white px-3 py-3 text-[0.85rem] font-medium
                text-neutral-700 transition-all
                hover:border-blue-600 hover:text-blue-600
              `}
            >
              Reset to Starter
            </button>
          </div>

          <div className={`
            rounded border border-amber-300 bg-amber-50 p-3.5 text-amber-900
          `}
          >
            <strong className="mb-1.5 block">Workflow</strong>
            <ol className="m-0 space-y-1.5 pl-5 text-xs">
              <li>Review the prompt and note the starter function signature.</li>
              <li>Write your solution in the editor; edits clear prior results automatically.</li>
              <li>Submit to run the test suite and inspect the per-case feedback below.</li>
            </ol>
          </div>
        </div>

        <TestSummary
          testResults={testResults}
          testsPassed={testsPassed}
          totalTests={totalTests}
          allTestsPassed={allTestsPassed}
        />

        <TestList
          testCases={testCases}
          testStatusMap={testStatusMap}
          testResults={testResults}
        />

        {/* Problem title */}
        <h3 className="mt-0 mb-3 text-base text-blue-600">
          Two Sum
        </h3>

        {/* Problem description */}
        <div className="mb-4">
          <strong>Description:</strong>
          <p className="my-2 text-neutral-600">
            Given an array of integers
            {" "}
            <code>nums</code>
            {" "}
            and an integer
            {" "}
            <code>target</code>
            , return the indices of the two numbers that add up to the target.
          </p>
          <p className="my-2 text-neutral-600">
            You may assume that each input has exactly one solution, and you may not use the same element twice.
          </p>
          <p className="my-2 text-neutral-600">
            You can return the answer in any order.
          </p>
        </div>

        {/* Example 1 */}
        <div className="mb-4 rounded bg-neutral-100 p-3">
          <strong className="text-neutral-700">Example 1:</strong>
          <div className="my-2 font-mono text-neutral-600">
            <div>Input: nums = [2,7,11,15], target = 9</div>
            <div>Output: [0,1]</div>
            <div className="mt-1 text-xs text-neutral-400">
              Explanation: nums[0] + nums[1] = 2 + 7 = 9
            </div>
          </div>
        </div>

        {/* Example 2 */}
        <div className="mb-4 rounded bg-neutral-100 p-3">
          <strong className="text-neutral-700">Example 2:</strong>
          <div className="my-2 font-mono text-neutral-600">
            <div>Input: nums = [3,2,4], target = 6</div>
            <div>Output: [1,2]</div>
            <div className="mt-1 text-xs text-neutral-400">
              Explanation: nums[1] + nums[2] = 2 + 4 = 6
            </div>
          </div>
        </div>

        {/* Example 3 */}
        <div className="mb-4 rounded bg-neutral-100 p-3">
          <strong className="text-neutral-700">Example 3:</strong>
          <div className="my-2 font-mono text-neutral-600">
            <div>Input: nums = [3,3], target = 6</div>
            <div>Output: [0,1]</div>
          </div>
        </div>

        {/* Constraints */}
        <div className="mt-6 border-t pt-4">
          <strong className="text-neutral-700">Constraints:</strong>
          <ul className="m-0 mt-2 space-y-0 pl-5 text-neutral-600">
            <li>2 ≤ nums.length ≤ 10⁴</li>
            <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
            <li>-10⁹ ≤ target ≤ 10⁹</li>
            <li>Only one valid answer exists.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
