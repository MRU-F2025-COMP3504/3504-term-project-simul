import type { ProblemDefinition, TestDetail, TestResults } from "~/types/coding-session";

import { Button } from "~/components/ui/button";

import { TestList } from "./test-list";
import { TestSummary } from "./test-summary";

export type ProblemPanelProps = {
  problem: ProblemDefinition;
  testResults: TestResults | null;
  testStatusMap: Map<string, TestDetail> | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onReset: () => void;
};

export function ProblemPanel({
  problem,
  testResults,
  testStatusMap,
  isSubmitting,
  onSubmit,
  onReset,
}: ProblemPanelProps) {
  const totalTests = problem.testCases.length;
  const testsPassed = testResults?.passed ?? 0;
  const allTestsPassed = Boolean(testResults) && testsPassed === totalTests;

  return (
    <div className={`
      bg-background flex w-[300px] flex-col overflow-hidden border-l
    `}
    >
      {/* Problem header */}
      <div className={`
        text-muted-foreground border-b p-4 text-sm font-bold uppercase
      `}
      >
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
              variant="default"
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Code"}
            </Button>
            <Button
              type="button"
              onClick={onReset}
              variant="outline"
              className="w-full"
            >
              Reset to Starter
            </Button>
          </div>

          <div className={`
            rounded border border-amber-300 bg-amber-50 p-3.5 text-amber-900
            dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100
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
          testCases={problem.testCases}
          testStatusMap={testStatusMap}
          testResults={testResults}
          renderTestInput={problem.renderTestInput}
        />

        <h3 className="text-primary mt-0 mb-3 text-base font-semibold">
          {problem.title}
        </h3>

        <div className="mb-4">
          <strong>Description:</strong>
          {problem.description.map(paragraph => (
            <p
              key={paragraph.slice(0, 50)}
              className="text-muted-foreground my-2"
            >
              {paragraph.split("`").map((part, partIndex) =>
                partIndex % 2 === 0
                  ? part
                  : (
                      <code key={part}>{part}</code>
                    ),
              )}
            </p>
          ))}
        </div>

        {/* Examples */}
        {problem.examples.map(example => (
          <div key={example.title} className="bg-muted mb-4 rounded p-3">
            <strong className="text-primary">
              {example.title}
              :
            </strong>
            <div className="text-muted-foreground my-2 font-mono">
              <div>
                Input:
                {example.input}
              </div>
              <div>
                Output:
                {example.output}
              </div>
              {example.explanation && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Explanation:
                  {" "}
                  {example.explanation}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Constraints */}
        {problem.constraints.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <strong className="text-primary">Constraints:</strong>
            <ul className="text-muted-foreground m-0 mt-2">
              {problem.constraints.map(constraint => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
