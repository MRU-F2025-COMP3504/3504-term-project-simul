import { describe, expect, it } from "vitest";

import { executePistonCode } from "~/actions/piston-actions/execute-code";

import { expectedBehaviors, maliciousCodeSamples } from "../fixtures/malicious-code";

describe("piston Performance Integration - Resource Limits", () => {
  describe("cPU Time Limits", () => {
    it("should timeout infinite loop (JavaScript)", async () => {
      const startTime = Date.now();

      const result = await executePistonCode({
        language: "javascript",
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: maliciousCodeSamples.infiniteLoop.javascript,
          },
        ],
      });

      const duration = Date.now() - startTime;

      // Should timeout within reasonable time (< 15 seconds)
      expect(duration).toBeLessThan(expectedBehaviors.infiniteLoop.maxDuration);

      // Should either error or indicate timeout in output
      if (result.serverError) {
        expect(result.serverError).toBeTruthy();
      }
      else {
        const output = (
          result.data?.output
          || result.data?.stderr
          || ""
        ).toLowerCase();

        const hasTimeout = expectedBehaviors.infiniteLoop.shouldContain.some(
          text => output.includes(text.toLowerCase()),
        );
        expect(hasTimeout).toBeTruthy();
      }
    }, 20000); // Vitest timeout of 20 seconds

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
      });

      if (result.serverError) {
        expect(result.serverError).toBeTruthy();
      }
      else {
        const output = (
          result.data?.output
          || result.data?.stderr
          || ""
        ).toLowerCase();

        const hasTimeout = expectedBehaviors.infiniteLoop.shouldContain.some(
          text => output.includes(text.toLowerCase()),
        );
        expect(hasTimeout).toBeTruthy();
      }
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
