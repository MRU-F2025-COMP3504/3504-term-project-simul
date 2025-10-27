export type TestSummaryProps = {
  testResults: { passed: number; total: number } | null;
  testsPassed: number;
  totalTests: number;
  allTestsPassed: boolean;
};

export function TestSummary({ testResults, testsPassed, totalTests, allTestsPassed }: TestSummaryProps) {
  return (
    <div
      className={`
        mb-6 rounded border p-4
        ${
    allTestsPassed
      ? `
        border-green-300 bg-green-50 text-green-900
        dark:border-green-700 dark:bg-green-900 dark:text-green-100
      `
      : testResults
        ? `
          border-red-300 bg-red-50 text-red-900
          dark:border-red-700 dark:bg-red-900 dark:text-red-100
        `
        : `
          border-indigo-200 bg-indigo-50 text-indigo-900
          dark:border-indigo-700 dark:bg-indigo-900 dark:text-indigo-100
        `
    }
      `}
    >
      <div className="mb-2 font-bold">
        {testResults ? (allTestsPassed ? "✓ All Tests Passed" : "✗ Tests Failed") : "Automated Feedback"}
      </div>
      <div className="text-[0.8rem]">
        {testsPassed}
        {" / "}
        {totalTests}
        {" "}
        tests passed
      </div>
      {!testResults && (
        <div className="mt-2 text-xs">
          Submit your code to run all test cases.
        </div>
      )}
    </div>
  );
}
