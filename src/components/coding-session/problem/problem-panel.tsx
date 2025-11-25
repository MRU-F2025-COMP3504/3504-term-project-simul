import type { ProblemDefinition, TestDetail, TestResults } from "~/types/coding-session";

import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { TestList } from "./test-list";

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
  const _totalTests = problem.testCases.length;
  const _testsPassed = testResults?.passed ?? 0;

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden border">

      {/* Problem content */}
      <div className="flex-1 overflow-auto p-4 text-[0.85rem] leading-relaxed">
        {/* Actions and guidance */}

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
        {problem.examples.length > 0 && (
          <div className="mb-4">
            <Tabs defaultValue={problem.examples[0]?.title} className="w-full">
              <TabsList className="mb-3">
                {problem.examples.map(example => (
                  <TabsTrigger key={example.title} value={example.title}>
                    {example.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {problem.examples.map(example => (
                <TabsContent key={example.title} value={example.title}>
                  <div className="bg-muted rounded p-3">
                    <div className="text-muted-foreground font-mono">
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
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

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
        </div>

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
