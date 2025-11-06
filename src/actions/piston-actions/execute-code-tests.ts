"use server";

import { z } from "zod";

import type { PistonExecuteResponse, TestResult } from "~/types/piston";

import { serverEnv } from "~/lib/env";
import { actionClient } from "~/lib/safe-action";

/**
 * Execute code with test cases using Piston
 *
 * Wraps user code with test case execution logic and runs it in Piston.
 * Returns structured results for each test case.
 * Supports multiple files for complex solutions.
 *
 * @example
 * ```typescript
 * const result = await executeWithTests({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [{ name: "main.js", content: "function twoSum(nums, target) { ... }" }],
 *   functionName: "twoSum",
 *   testCases: [
 *     { name: "Test 1", input: { nums: [2,7], target: 9 }, expected: [0,1] }
 *   ],
 * });
 * ```
 */
export const executeWithTests = actionClient
  .inputSchema(
    z.object({
      language: z.string(),
      version: z.string(),
      files: z.array(
        z.object({
          name: z.string(),
          content: z.string(),
        }),
      ).min(1, "At least one file is required"),
      functionName: z.string().describe("Name of the function to test (e.g., 'twoSum')"),
      testCases: z.array(
        z.object({
          name: z.string(),
          input: z.array(z.any()).describe("Array of input parameters for the function"),
          expected: z.any().describe("Expected output"),
        }),
      ),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { language, version, files, functionName, testCases } = parsedInput;

    // Generate test wrapper based on language
    let testWrapper = "";

    if (language === "javascript" || language === "typescript") {
      testWrapper = `
${files.map(f => f.content).join("\n\n")}

// Test execution
const testResults = [];

${testCases
  .map(
    tc => `
try {
  // Call the function with the input parameters
  const inputArgs = ${JSON.stringify(tc.input)};
  const result = ${functionName}(...inputArgs);
  
  const expected = ${JSON.stringify(tc.expected)};
  
  // Deep equality check
  const passed = JSON.stringify(result) === JSON.stringify(expected);
  
  if (!passed) {
    testResults.push({
      name: ${JSON.stringify(tc.name)},
      passed: false,
      error: \`Expected \${JSON.stringify(expected)}, got \${JSON.stringify(result)}\`
    });
  } else {
    testResults.push({
      name: ${JSON.stringify(tc.name)},
      passed: true
    });
  }
} catch (error) {
  testResults.push({
    name: ${JSON.stringify(tc.name)},
    passed: false,
    error: error.message
  });
}
`,
  )
  .join("\n")}

console.log(JSON.stringify(testResults));
`;
    }
    else if (language === "python" || language.startsWith("python")) {
      testWrapper = `
${files.map(f => f.content).join("\n\n")}

import json

test_results = []

def deep_equal(a, b):
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(deep_equal(x, y) for x, y in zip(a, b))
    elif isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(deep_equal(a[k], b[k]) for k in a)
    else:
        return a == b

${testCases
  .map(
    tc => `
try:
    input_args = ${JSON.stringify(tc.input)}
    result = ${functionName}(*input_args)
    expected = ${JSON.stringify(tc.expected)}
    passed = deep_equal(result, expected)
    if not passed:
        test_results.append({
            "name": ${JSON.stringify(tc.name)},
            "passed": False,
            "error": f"Expected {json.dumps(expected)}, got {json.dumps(result)}"
        })
    else:
        test_results.append({
            "name": ${JSON.stringify(tc.name)},
            "passed": True
        })
except Exception as error:
    test_results.append({
        "name": ${JSON.stringify(tc.name)},
        "passed": False,
        "error": str(error)
    })
`,
  )
  .join("\n")}

print(json.dumps(test_results))
`;
    }
    else {
      // TODO: Consider implementing a fallback strategy for unsupported languages.
      // Reference: Create an issue in the tracker if fallback support is desired.
      throw new Error(`Unsupported language: ${language}. Only JavaScript, TypeScript, and Python are supported.`);
    }

    try {
      const response = await fetch(`${serverEnv.PISTON_URL}/api/v2/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          version,
          files: [
            {
              name:
                language === "javascript" || language === "typescript"
                  ? "test.js"
                  : language === "python" || language.startsWith("python")
                    ? "main.py"
                    : files[0].name,
              content: testWrapper,
            },
          ],
        }),
      });

      if (!response.ok) {
        let errorBody: string | undefined;
        try {
          errorBody = await response.text();
        }
        catch {
          errorBody = "(Failed to read response body)";
        }
        throw new Error(
          `Piston API error: ${response.status} ${response.statusText}. Response body: ${errorBody}`,
        );
      }

      const data = (await response.json()) as PistonExecuteResponse;

      // Parse test results from stdout
      let testResults: TestResult[];
      try {
        testResults = JSON.parse(data.run.stdout.trim()) as TestResult[];
      }
      catch {
        // If parsing fails, treat as runtime error
        return {
          success: false,
          error: data.run.stderr || data.run.output || "Failed to parse test results",
        };
      }

      const passed = testResults.filter((r: TestResult) => r.passed).length;

      return {
        success: true,
        results: {
          passed,
          total: testCases.length,
          details: testResults,
        },
      };
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
