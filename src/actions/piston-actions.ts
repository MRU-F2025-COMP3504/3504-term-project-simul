"use server";

import { z } from "zod";

import type { PistonExecuteResponse } from "~/types/piston";

import { serverEnv } from "~/lib/env";
import { actionClient } from "~/lib/safe-action";

/**
 * Execute code using Piston
 *
 * Sends code to Piston API for execution in a sandboxed environment.
 * Supports multiple languages (JavaScript/Node.js, Python, etc.) as long as runtime is installed.
 * Can handle multiple files for complex projects.
 *
 * @example
 * Single file:
 * ```typescript
 * const result = await executeCode({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [{ name: "main.js", content: "console.log('Hello');" }],
 * });
 * ```
 *
 * Multiple files:
 * ```typescript
 * const result = await executeCode({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [
 *     { name: "index.js", content: "import { greet } from './utils.js'; greet();" },
 *     { name: "utils.js", content: "export const greet = () => console.log('Hi');" }
 *   ],
 * });
 * ```
 */
export const executeCode = actionClient
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
    }),
  )
  .action(async ({ parsedInput }) => {
    const { language, version, files } = parsedInput;

    try {
      const response = await fetch(`${serverEnv.PISTON_URL}/api/v2/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          version,
          files,
        }),
      });

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.statusText}`);
      }

      const data = (await response.json()) as PistonExecuteResponse;

      return {
        success: true,
        output: data.run.output,
        stdout: data.run.stdout,
        stderr: data.run.stderr,
        exitCode: data.run.code,
      };
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

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
          input: z.any().describe("Input object with parameters for the function"),
          expected: z.any().describe("Expected output"),
        }),
      ),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { language, version, files, functionName, testCases } = parsedInput;

    // Test execution wrapper with original files without return statement call (proper way)
    const testWrapper = `
${files.map(f => f.content).join("\n\n")}

// Test execution
const testResults = [];

${testCases
  .map(
    tc => `
try {
  // Call the function with the input parameters
  const inputArgs = ${JSON.stringify(Object.values(tc.input))};
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
              name: "main.js",
              content: testWrapper,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.statusText}`);
      }

      const data = (await response.json()) as PistonExecuteResponse;

      // Parse test results from stdout
      let testResults;
      try {
        testResults = JSON.parse(data.run.stdout.trim());
      }
      catch {
        // If parsing fails, treat as runtime error
        return {
          success: false,
          error: data.run.stderr || data.run.output || "Failed to parse test results",
        };
      }

      const passed = testResults.filter((r: any) => r.passed).length;

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
