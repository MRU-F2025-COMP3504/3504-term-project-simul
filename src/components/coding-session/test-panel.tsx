import type { ProblemDefinition, TestDetail, TestResults } from "~/types/coding-session";

import { TestList } from "./problem/test-list";

export type TestPanelProps = {
  problem: ProblemDefinition;
  testResults: TestResults | null;
  testStatusMap: Map<string, TestDetail> | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onReset: () => void;
};

export function TestPanel({
  problem,
  testResults,
  testStatusMap,
}: Omit<TestPanelProps, "isSubmitting" | "onSubmit" | "onReset">) {
  return (
    <div className="bg-background flex h-full flex-col overflow-hidden border">
      {/* Test Results */}
      <div className="flex-1 overflow-auto p-3">
        <TestList
          testCases={problem.testCases}
          testStatusMap={testStatusMap}
          testResults={testResults}
          renderTestInput={problem.renderTestInput}
        />
      </div>
    </div>
  );
}
