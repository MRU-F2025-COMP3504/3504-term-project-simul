import type { TestCase, TestDetail } from "~/types/coding-session";

export type TestListProps = {
  testCases: TestCase[];
  testStatusMap: Map<string, TestDetail> | null;
  testResults: { passed: number; total: number } | null;
};

export function TestList({ testCases, testStatusMap, testResults }: TestListProps) {
  return (
    <div className="mb-6">
      <strong className="mb-2 block text-neutral-700">Test Suite</strong>
      <div className="flex flex-col gap-3">
        {testCases.map((testCase) => {
          const detail = testStatusMap?.get(testCase.name);
          const isPending = !testResults;
          const isPassed = detail?.passed;
          const statusLabel = isPending ? "Pending" : isPassed ? "Passed" : "Failed";
          const badgeColor = isPending ? "text-neutral-700" : isPassed ? "text-green-900" : "text-red-900";
          const badgeBackground = isPending ? "bg-neutral-200" : isPassed ? "bg-green-100" : "bg-red-100";
          const cardBorder = isPending ? "border-neutral-200" : isPassed ? "border-green-200" : "border-red-200";
          const cardBackground = isPending ? "bg-white" : isPassed ? "bg-green-50/50" : "bg-red-50/50";

          return (
            <div
              key={testCase.name}
              className={`
                rounded border p-3
                ${cardBorder}
                ${cardBackground}
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-700">{testCase.name}</span>
                <span className={`
                  rounded-full px-2 py-0.5 text-[0.7rem] tracking-wider
                  uppercase
                  ${badgeBackground}
                  ${badgeColor}
                `}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="mt-1.5 text-xs text-neutral-600">
                {testCase.description}
              </div>
              <div className="mt-1.5 font-mono text-xs text-neutral-600">
                nums =
                {" "}
                {JSON.stringify(testCase.input.nums)}
                , target =
                {" "}
                {testCase.input.target}
              </div>
              {detail && detail.error && (
                <div className="mt-2 text-xs text-red-800">
                  {detail.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
