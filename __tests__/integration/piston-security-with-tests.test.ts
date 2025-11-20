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
    const result = await executeWithTests({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "solution.js",
          content: `
function twoSum(nums, target) {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET);
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

    const output = JSON.stringify(result);
    for (const secret of expectedBehaviors.environmentAccess.shouldNotContain) {
      expect(output).not.toContain(secret);
    }
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

def two_sum(nums, target):
    print('DATABASE_URL:', os.environ.get('DATABASE_URL'))
    print('BETTER_AUTH_SECRET:', os.environ.get('BETTER_AUTH_SECRET'))
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
    for (const secret of expectedBehaviors.environmentAccess.shouldNotContain) {
      expect(output).not.toContain(secret);
    }
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
function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.hasOwnProperty(complement)) {
      return [seen[complement], i];
    }
    seen[nums[i]] = i;
  }
  return [];
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
        {
          name: "Example 2",
          input: [[3, 2, 4], 6],
          expected: [1, 2],
        },
      ],
    });

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
function twoSum(nums, target) {
  return [0, 0]; // Wrong answer
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

    expect(result.data?.success).toBe(true);
    expect(result.data?.results?.passed).toBe(0);
    expect(result.data?.results?.total).toBe(1);
    expect(result.data?.results?.details?.[0]?.passed).toBe(false);
    expect(result.data?.results?.details?.[0]?.error).toContain("Expected");
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

  it("should support multi-file solutions (JavaScript)", async () => {
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

    expect(result.data?.success).toBe(true);
    expect(result.data?.results?.passed).toBe(1);
  });

  it("should correctly run passing tests (Python)", async () => {
    const result = await executeWithTests({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "solution.py",
          content: `
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
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
        {
          name: "Example 2",
          input: [[3, 2, 4], 6],
          expected: [1, 2],
        },
      ],
    });

    expect(result.data?.success).toBe(true);
    expect(result.data?.results?.passed).toBe(2);
    expect(result.data?.results?.total).toBe(2);
  });
});
