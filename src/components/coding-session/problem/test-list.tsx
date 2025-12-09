"use client";

import type { TestCase, TestDetail } from "~/types/coding-session";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export type TestListProps = {
  testCases: TestCase[];
  testStatusMap: Map<string, TestDetail> | null;
  testResults: { passed: number; total: number } | null;
  renderTestInput?: (input: any) => string;
};

export function TestList({ testCases, testStatusMap, testResults, renderTestInput }: TestListProps) {
  return (
    <div className="mb-6">
      <strong className="text-primary mb-2 block">Test Suite</strong>
      <Tabs defaultValue={testCases[0]?.name} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {testCases.map((testCase) => {
            const detail = testStatusMap?.get(testCase.name);
            const isPending = !testResults;
            const isPassed = detail?.passed;
            const statusLabel = isPending ? "Pending" : isPassed ? "Passed" : "Failed";
            const badgeColor = isPending ? "text-primary" : isPassed ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100";
            const badgeBackground = isPending ? "bg-muted" : isPassed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900";

            return (
              <TabsTrigger
                key={testCase.name}
                value={testCase.name}
                className="relative"
              >
                <span>{testCase.name}</span>
                <span className={`
                  ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem]
                  tracking-wider uppercase
                  ${badgeBackground}
                  ${badgeColor}
                `}
                >
                  {statusLabel}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {testCases.map((testCase) => {
          const detail = testStatusMap?.get(testCase.name);
          const isPending = !testResults;
          const isPassed = detail?.passed;
          const cardBorder = isPending ? "border-muted" : isPassed ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900";
          const cardBackground = isPending ? "bg-card" : isPassed ? "bg-green-50/50 dark:bg-green-900" : "bg-red-50/50 dark:bg-red-900";

          // Render test input using custom renderer or JSON.stringify
          const inputDisplay = renderTestInput
            ? renderTestInput(testCase.input)
            : JSON.stringify(testCase.input);

          return (
            <TabsContent
              key={testCase.name}
              value={testCase.name}
              className={`
                mt-3 rounded border p-3
                ${cardBorder}
                ${cardBackground}
              `}
            >
              <div className="text-muted-foreground text-xs">
                {testCase.description}
              </div>
              <div className="text-muted-foreground mt-1.5 font-mono text-xs">
                {inputDisplay}
              </div>
              {detail && detail.error && (
                <div className={`
                  mt-2 text-xs text-red-800
                  dark:text-red-200
                `}
                >
                  {detail.error}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
