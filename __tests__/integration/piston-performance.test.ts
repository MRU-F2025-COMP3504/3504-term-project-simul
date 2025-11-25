import { describe, expect, it } from "vitest";

import { executePistonCode } from "~/actions/piston-actions/execute-code";

import { expectedBehaviors, maliciousCodeSamples } from "../fixtures/malicious-code";

/**
 * Performance-related integration tests for Piston code execution.
 * These tests focus on enforcing resource limits such as CPU time and memory usage.
 *
 * Prerequisites:
 * - Piston container must be running (via docker-compose up)
 * - DATABASE_URL must be set in .env
 */
describe("piston Performance Integration - Resource Limits", () => {
  describe("cPU Time Limits", () => {
    it("should timeout infinite loop (JavaScript)", async () => {
      const result = await executePistonCode({
        language: "javascript",
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: maliciousCodeSamples.infiniteLoop.javascript,
          },
        ],
        run_timeout: 3,
      });

      // Debug output
      console.warn("Result:", JSON.stringify(result.data, null, 2));

      // Process was killed if:
      // 1. exitCode is null (terminated by signal)
      // 2. exitCode is 137 (SIGKILL)
      // 3. Output contains timeout/killed message
      // 4. Output is empty but process didn't complete normally
      const output = (
        result.data?.output
        || result.data?.stderr
        || ""
      ).toLowerCase();

      const wasKilled
        = result.data?.exitCode === null
          || result.data?.exitCode === 137
          || output.includes("killed")
          || output.includes("timeout")
          || output.includes("exceeded");

      expect(wasKilled).toBeTruthy();
    }, 20000);

    it("should timeout infinite loop (Python)", async () => {
      const startTime = Date.now();

      await executePistonCode({
        language: "python",
        version: "3.10.0",
        files: [
          {
            name: "test.py",
            content: maliciousCodeSamples.infiniteLoop.python,
          },
        ],
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(expectedBehaviors.infiniteLoop.maxDuration);
    }, 20000);

    it("should timeout busy loop (JavaScript)", async () => {
      const result = await executePistonCode({
        language: "javascript",
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: maliciousCodeSamples.infiniteLoop.javascriptBusyLoop,
          },
        ],
        run_timeout: 3,
      });

      console.warn("Result:", JSON.stringify(result.data, null, 2));

      const output = (
        result.data?.output
        || result.data?.stderr
        || ""
      ).toLowerCase();

      const wasKilled
        = result.data?.exitCode === null
          || result.data?.exitCode === 137
          || output.includes("killed")
          || output.includes("timeout")
          || output.includes("exceeded");

      expect(wasKilled).toBeTruthy();
    }, 20000);
  });

  describe("memory Limits", () => {
    it("should limit memory consumption (JavaScript array)", async () => {
      const result = await executePistonCode({
        language: "javascript",
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: maliciousCodeSamples.memoryBomb.javascript,
          },
        ],
        compile_memory_limit: 2 * 1024 * 1024, // 2 MB
        run_memory_limit: 2 * 1024 * 1024,
      });

      const output = (
        result.data?.output
        || result.data?.stderr
        || result.serverError
        || ""
      ).toLowerCase();
      // console.warn("Result:", result);
      // console.warn("Output:", result.data?.output);
      // console.warn("Stderr:", result.data?.stderr);
      // console.warn("ServerError:", result.serverError);

      /**
      Result: {
        data: { success: true, output: '', stdout: '', stderr: '', exitCode: null }
      }
      Output:
      Stderr:
      ServerError: undefined
       */

      const hasMemoryLimit = expectedBehaviors.memoryBomb.shouldContain.some(
        text => output.includes(text.toLowerCase()),
      );
      expect(hasMemoryLimit).toBeTruthy();
    }, 20000);

    it("should limit memory consumption (JavaScript string)", async () => {
      const result = await executePistonCode({
        language: "javascript",
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: maliciousCodeSamples.memoryBomb.javascriptStringBomb,
          },
        ],
      });

      const output = (
        result.data?.output
        || result.data?.stderr
        || result.serverError
        || ""
      ).toLowerCase();

      const hasMemoryLimit = expectedBehaviors.memoryBomb.shouldContain.some(
        text => output.includes(text.toLowerCase()),
      );
      expect(hasMemoryLimit).toBeTruthy();
    }, 20000);

    /**
    Result: {
      data: { success: true, output: '', stdout: '', stderr: '', exitCode: null }
    }
    Output:
    Stderr:
    ServerError: undefined
     */
    it("should limit memory consumption (Python)", async () => {
      const result = await executePistonCode({
        language: "python",
        version: "3.10.0",
        files: [
          {
            name: "test.py",
            content: maliciousCodeSamples.memoryBomb.python,
          },
        ],
      });

      console.warn("Result:", JSON.stringify(result.data, null, 2));

      const output = (
        result.data?.output
        || result.data?.stderr
        || ""
      ).toLowerCase();

      // Process was killed by memory limit if:
      // 1. exitCode is null or 137 (killed by signal)
      // 2. Output contains memory/killed indicators
      // 3. MemoryError was raised
      const wasMemoryLimited
        = result.data?.exitCode === null
          || result.data?.exitCode === 137
          || output.includes("killed")
          || output.includes("memory")
          || output.includes("memoryerror");

      expect(wasMemoryLimited).toBeTruthy();
    }, 20000);
  });

  describe("output Size Limits", () => {
    it("should limit output size (JavaScript)", async () => {
      const result = await executePistonCode({
        language: "javascript",
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: maliciousCodeSamples.outputFlood.javascript,
          },
        ],
      });

      const output = result.data?.output || result.data?.stdout || "";

      // Output should be truncated (≤ 10MB)
      expect(output.length).toBeLessThanOrEqual(
        expectedBehaviors.outputFlood.maxOutputSize,
      );
    }, 30000); // Allow extra time for large output

    it("should handle large output without crashing (Python)", async () => {
      const result = await executePistonCode({
        language: "python",
        version: "3.10.0",
        files: [
          {
            name: "test.py",
            content: maliciousCodeSamples.outputFlood.python,
          },
        ],
      });

      const output = result.data?.output || result.data?.stdout || "";

      expect(output.length).toBeLessThanOrEqual(
        expectedBehaviors.outputFlood.maxOutputSize,
      );
    }, 30000);
  });
});
