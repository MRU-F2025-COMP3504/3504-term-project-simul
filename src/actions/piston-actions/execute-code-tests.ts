"use server";

import { z } from "zod";

import type { PistonExecuteResponse, TestResult } from "~/types/piston";

import { serverEnv } from "~/lib/env";
import { sanitizeErrorMessage, sanitizePistonResult } from "~/lib/piston-sanitization";
import { SUPPORTED_LANGUAGES, validatePistonInput } from "~/lib/piston-validation";
import { actionClient } from "~/lib/safe-action";

/**
 * Execute code with test cases using Piston
 *
 * Runs user code against provided test cases and returns pass/fail results.
 * Supports multiple files for modular code organization.
 *
 * Security: All inputs validated, outputs sanitized, execution sandboxed.
 *
 * @see docs/actions.md for full documentation and security constraints
 *
 * @example Single file with tests
 * ```typescript
 * const result = await executeWithTests({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [{ name: "solution.js", content: "function twoSum(nums, target) {...}" }],
 *   functionName: "twoSum",
 *   testCases: [
 *     { name: "Example 1", input: [[2,7,11,15], 9], expected: [0,1] },
 *   ],
 * });
 * ```
 *
 * @example Multiple files (imports/modules)
 * ```typescript
 * const result = await executeWithTests({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [
 *     { name: "solution.js", content: "import { helper } from './utils.js'; ..." },
 *     { name: "utils.js", content: "export const helper = () => {...};" },
 *   ],
 *   functionName: "solve",
 *   testCases: [...],
 * });
 * ```
 */
export const executeWithTests = actionClient
  .inputSchema(
    z.object({
      language: z.enum(SUPPORTED_LANGUAGES),
      version: z.string().regex(/^\d+\.\d+\.\d+$/, {
        message: "Version must be in semver format (e.g., 20.11.1)",
      }),
      files: z
        .array(
          z.object({
            name: z.string(),
            content: z.string().max(100 * 1024, "File content must be less than 100KB"),
          }),
        )
        .min(1, "At least one file is required"),
      functionName: z.string().min(1, "Function name is required"),
      testCases: z
        .array(
          z.object({
            name: z.string(),
            input: z.array(z.any()),
            expected: z.any(),
          }),
        )
        .min(1, "At least one test case is required"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { language, version, files, functionName, testCases } = parsedInput;

    // Validate language and version are supported
    const validation = validatePistonInput({
      language,
      version,
      files,
    });

    if (!validation.success) {
      throw new Error(validation.errors?.issues[0]?.message ?? "Validation failed");
    }

    // Make JSON markers/delimiters unique to avoid collisions with user output
    const START_MARKER = `__SIMUL_TEST_RESULTS_START_${Date.now()}_${Math.random().toString(36)}__`;
    const END_MARKER = `__SIMUL_TEST_RESULTS_END_${Date.now()}_${Math.random().toString(36)}__`;

    // Generate test wrapper based on language
    let testWrapper = "";

    if (language === "javascript") {
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

console.log("${START_MARKER}");
console.log(JSON.stringify(testResults));
console.log("${END_MARKER}");
`;
    }
    else if (language === "python") {
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

print("${START_MARKER}")
print(json.dumps(test_results))
print("${END_MARKER}")
`;
    }
    else {
      throw new Error(`Unsupported language: ${language}. Only JavaScript and Python are supported.`);
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
              name: language === "javascript" ? "test.js" : "main.py",
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

      // Sanitize the output before parsing
      const sanitized = sanitizePistonResult(data.run);

      // Parse test results from stdout
      let testResults: TestResult[];
      try {
        const stdout = sanitized.stdout.trim();

        const startIdx = stdout.indexOf(START_MARKER);
        const endIdx = stdout.indexOf(END_MARKER);

        if (startIdx === -1 || endIdx === -1) {
          throw new Error("Test results markers not found in output");
        }

        // Extract only the JSON between markers
        const jsonStr = stdout
          .slice(startIdx + START_MARKER.length, endIdx)
          .trim();
        testResults = JSON.parse(jsonStr) as TestResult[];
      }
      catch (error) {
        // Sanitize error messages
        const errorMsg
          = sanitized.stderr
            || sanitized.output
            || `Failed to parse test results: ${error instanceof Error ? error.message : String(error)}`;
        return {
          success: false,
          error: sanitizeErrorMessage(errorMsg),
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
      // Sanitize error messages before returning
      const message
        = error instanceof Error ? sanitizeErrorMessage(error.message) : "Unknown error";

      return {
        success: false,
        error: message,
      };
    }
  });
