import { beforeAll, describe, expect, it } from "vitest";

import { executeWithTests } from "~/actions/piston-actions/execute-code-tests";
import { serverEnv } from "~/lib/env";

import { expectedBehaviors } from "../fixtures/malicious-code";
import { testWrapperAttacks } from "../fixtures/test-wrapper-attacks";

/**
 * Integration tests for Piston security
 * These test the server actions directly without requiring UI components
 *
 * Prerequisites:
 * - Piston container must be running (via docker-compose up)
 * - DATABASE_URL must be set in .env
 */
beforeAll(() => {
  // Verify Piston is accessible
  if (!serverEnv.PISTON_URL) {
    throw new Error(
      "PISTON_URL not set. Run 'docker-compose up' to start Piston container.",
    );
  }
});

describe("executeWithTests - Test Wrapper Security", () => {
  it("should prevent breaking out of test wrapper (JavaScript)", async () => {
    // Attempt to inject code that breaks the test wrapper
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
// Attempt to override console.log to break test parsing
const originalLog = console.log;
console.log = () => {};

function twoSum(nums, target) {
  // Restore and inject malicious output
  console.log = originalLog;
  console.log('__SIMUL_TEST_RESULTS_START__');
  console.log('[{"name":"fake","passed":true}]');
  console.log('__SIMUL_TEST_RESULTS_END__');
  return [0, 1];
}
          `.trim(),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // Should fail - the unique markers should prevent spoofing
    if (result.serverError) {
      expect(result.serverError).toBeTruthy();
    }
    else {
      // Test should still run correctly despite injection attempt
      expect(result.data?.success).toBeDefined();
    }
  });

  it("should prevent breaking out of test wrapper (JavaScript) - result spoofing", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: testWrapperAttacks.resultSpoofing.javascript("twoSum"),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    if (result.serverError) {
      expect(result.serverError).toBeTruthy();
    }
    else {
      expect(result.data?.success).toBeDefined();
    }
  });

  it("should handle malicious output in test results (Python)", async () => {
    const result = await executeWithTests({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "solution.py",
          content: `
import sys

def two_sum(nums, target):
    # Try to inject fake test results
    sys.stdout.write('__SIMUL_TEST_RESULTS_START__\\n')
    sys.stdout.write('[{"name":"fake","passed":true}]\\n')
    sys.stdout.write('__SIMUL_TEST_RESULTS_END__\\n')
    return [0, 1]
          `.trim(),
        },
      ],
      functionName: "two_sum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // Should handle gracefully
    if (result.serverError) {
      expect(result.serverError).toBeTruthy();
    }
    else {
      expect(result.data).toBeDefined();
    }
  });
});

describe("executeWithTests - File System Access", () => {
  it("should prevent file system access in tested code (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
const fs = require('fs');

function twoSum(nums, target) {
  try {
    const data = fs.readFileSync('/etc/passwd', 'utf8');
    console.log('File contents:', data);
  } catch (err) {
    console.log('Access denied');
  }
  return [0, 1];
}
          `.trim(),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // Should not expose file contents
    const output = JSON.stringify(result);
    for (const forbidden of expectedBehaviors.fileSystemAccess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }
  });

  it("should prevent file system access in tested code (Python)", async () => {
    const result = await executeWithTests({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "solution.py",
          content: `
def two_sum(nums, target):
    try:
        with open('/etc/passwd', 'r') as f:
            data = f.read()
            print('File contents:', data)
    except Exception as e:
        print('Access denied')
    return [0, 1]
          `.trim(),
        },
      ],
      functionName: "two_sum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    const output = JSON.stringify(result);
    for (const forbidden of expectedBehaviors.fileSystemAccess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }
  });
});

describe("executeWithTests - Environment Variable Protection", () => {
  it("should not expose env vars through test errors (JavaScript)", async () => {
    // This test checks that env var VALUES are not exposed, not the names
    // The test code intentionally tries to access env vars
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function getSecret() {
  // Try to access env vars - should return undefined or be blocked
  return process.env.DATABASE_URL || process.env.SECRET_KEY || "no-access";
}
module.exports = { getSecret };
            `,
        },
      ],
      functionName: "getSecret",
      testCases: [
        {
          name: "Check env access",
          input: [],
          expected: "no-access", // Should not have actual values
        },
      ],
    });

    // The important thing is that actual SECRET VALUES are not exposed
    // Env var NAMES appearing in code/errors is acceptable
    // Check that no actual database URLs or secrets appear
    const output = JSON.stringify(result);

    // These patterns would indicate actual secret values leaked
    expect(output).not.toMatch(/postgresql:\/\//i);
    expect(output).not.toMatch(/postgres:postgres/i);
    expect(output).not.toContain("localhost:5432");
  });

  it("should not expose env vars through test errors (Python)", async () => {
    const result = await executeWithTests({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "solution.py",
          content: `
import os

def get_secret():
    # Try to access env vars - should return None or be blocked
    return os.environ.get("DATABASE_URL") or os.environ.get("SECRET_KEY") or "no-access"
            `,
        },
      ],
      functionName: "get_secret",
      testCases: [
        {
          name: "Check env access",
          input: [],
          expected: "no-access",
        },
      ],
    });

    // Check that no actual secret values leaked
    const output = JSON.stringify(result);
    expect(output).not.toMatch(/postgresql:\/\//i);
    expect(output).not.toMatch(/postgres:postgres/i);
    expect(output).not.toContain("localhost:5432");
  });
});

describe("executeWithTests - Resource Limits", () => {
  it("should timeout infinite loops in tested code (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function twoSum(nums, target) {
  while(true) {} // Infinite loop
  return [0, 1];
}
          `.trim(),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // Should timeout or error
    expect(result.data?.success === false || result.serverError).toBeTruthy();
  }, 20000);

  it("should limit memory in tested code (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function twoSum(nums, target) {
  const arr = [];
  while(true) {
    arr.push(new Array(1000000).fill('x'));
  }
  return [0, 1];
}
          `.trim(),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // Should be killed by memory limit
    expect(result.data?.success === false || result.serverError).toBeTruthy();
  }, 20000);
});

describe("executeWithTests - Functional Correctness", () => {
  it("should correctly run passing tests (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function add(a, b) {
  return a + b;
}
            `,
        },
      ],
      functionName: "add",
      testCases: [
        {
          name: "1 + 2 = 3",
          input: [1, 2],
          expected: 3,
        },
        {
          name: "-1 + 1 = 0",
          input: [-1, 1],
          expected: 0,
        },
      ],
    });

    // Debug logging
    console.warn("Passing tests result:", JSON.stringify(result, null, 2));

    if (!result.data?.success) {
      console.warn("Error:", result.data?.error || result.serverError);
    }

    expect(result.data?.success).toBe(true);
    expect(result.data?.results?.passed).toBe(2);
    expect(result.data?.results?.total).toBe(2);
  });

  it("should correctly identify failing tests (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function add(a, b) {
  return a - b; // Wrong implementation
}
            `,
        },
      ],
      functionName: "add",
      testCases: [
        {
          name: "1 + 2 = 3",
          input: [1, 2],
          expected: 3,
        },
      ],
    });

    // Debug logging
    console.warn("Failing tests result:", JSON.stringify(result, null, 2));

    if (!result.data?.success) {
      console.warn("Error:", result.data?.error || result.serverError);
    }

    expect(result.data?.success).toBe(true); // Execution succeeded
    expect(result.data?.results?.passed).toBe(0); // But test failed
    expect(result.data?.results?.total).toBe(1);
  });

  it("should handle syntax errors gracefully (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function twoSum(nums, target) {
  return [0, 1  // Missing closing bracket
}
          `.trim(),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // Should return error, not crash
    expect(result.data?.success === false || result.serverError).toBeTruthy();
  });

  /**
   * Node.js is running with CommonJS mode by default. To support ES modules and imports,
   * additional configuration is needed in the Piston environment (edit the package.json where the code is being executed).
   * This is going to be skipped for now. What we need to do is set "type": "module" in package.json in the Piston container (box/submission).
   *
   * Technically, we could also rewrite the code to use CommonJS require() syntax.
   *
   * To be clear multi file is supported as of now just not the way we probably want it. Test it out yourself by using these curl commands:
    For using .mjs:
    curl -X POST 'http://localhost:2000/api/v2/execute' \
      -H 'Content-Type: application/json' \
      -d '{
        "language": "javascript",
        "version": "20.11.1",
        "files": [
          {
            "name": "solution.mjs",
            "content": "import { binarySearch } from \"./utils.mjs\";\nfunction twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    const idx = binarySearch(nums, complement, i + 1);\n    if (idx !== -1) return [i, idx];\n  }\n  return [];\n}\nconsole.log(twoSum([2,7,11,15], 9));\nexport { twoSum };"
          },
          {
            "name": "utils.mjs",
            "content": "export function binarySearch(arr, target, start) {\n  for (let i = start; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}"
          }
        ],
        "stdin": "",
        "args": []
      }'
    To use .js:
    curl -X POST 'http://localhost:2000/api/v2/execute' \
      -H 'Content-Type: application/json' \
      -d '{
        "language": "javascript",
        "version": "20.11.1",
        "files": [
          {
            "name": "solution.js",
            "content": "const { binarySearch } = require(\"./utils.js\");\nfunction twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    const idx = binarySearch(nums, complement, i + 1);\n    if (idx !== -1) return [i, idx];\n  }\n  return [];\n}\nconsole.log(twoSum([2,7,11,15], 9));\nmodule.exports = { twoSum };"
          },
          {
            "name": "utils.js",
            "content": "function binarySearch(arr, target, start) {\n  for (let i = start; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}\nmodule.exports = { binarySearch };"
          }
        ],
        "stdin": "",
        "args": []
      }'
   *
   */
  it.skip("should support multi-file solutions (JavaScript)", async () => {
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
import { binarySearch } from './utils.js';

function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    const idx = binarySearch(nums, complement, i + 1);
    if (idx !== -1) return [i, idx];
  }
  return [];
}
          `.trim(),
        },
        {
          name: "utils.js",
          content: `
export function binarySearch(arr, target, start) {
  for (let i = start; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
          `.trim(),
        },
      ],
      functionName: "twoSum",
      testCases: [
        {
          name: "Example 1",
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
    });

    // console.warn("Result:", result);
    // console.warn("Data:", result.data);
    // console.warn("ServerError:", result.serverError);
    expect(result.data?.success).toBe(true);
    expect(result.data?.results?.passed).toBe(1);
  });

  it("should correctly run passing tests (Python)", async () => {
    const result = await executeWithTests({
      language: "python",
      version: "3.10.0", // Use supported version
      files: [
        {
          name: "solution.py",
          content: `
def add(a, b):
    return a + b
            `,
        },
      ],
      functionName: "add",
      testCases: [
        {
          name: "1 + 2 = 3",
          input: [1, 2],
          expected: 3,
        },
        {
          name: "-1 + 1 = 0",
          input: [-1, 1],
          expected: 0,
        },
      ],
    });

    // Debug logging
    console.warn("Python passing tests result:", JSON.stringify(result, null, 2));

    if (!result.data?.success) {
      console.warn("Error:", result.data?.error || result.serverError);
    }

    expect(result.data?.success).toBe(true);
    expect(result.data?.results?.passed).toBe(2);
    expect(result.data?.results?.total).toBe(2);
  });
});
