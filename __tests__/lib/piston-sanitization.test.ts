import { describe, expect, it } from "vitest";

import {
  sanitizeErrorMessage,
  sanitizePistonResult,
  truncateOutput,
} from "~/lib/piston-sanitization";
import { CONSTRAINTS } from "~/lib/piston-validation";

describe("piston Sanitization", () => {
  describe("sanitizeErrorMessage", () => {
    it("should remove internal Piston paths", () => {
      const error = "Error in /var/lib/piston/packages/node/20.11.1/bin/node";
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain("/var/lib/piston");
      expect(sanitized).toContain("[REDACTED]");
    });

    it("should remove user home directories", () => {
      const error = "File not found: /home/user/secret/config.json";
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain("/home/user");
      expect(sanitized).toContain("[REDACTED]");
    });

    it("should remove system paths", () => {
      const systemPaths = [
        "/usr/local/bin/python",
        "/etc/passwd",
        "/var/lib/piston/data",
      ];

      for (const path of systemPaths) {
        const error = `Error accessing ${path}`;
        const sanitized = sanitizeErrorMessage(error);

        expect(sanitized).not.toContain(path);
        expect(sanitized).toContain("[REDACTED]");
      }
    });

    it("should remove environment variable values", () => {
      const envVars = [
        "DATABASE_URL=postgresql://user:pass@localhost/db",
        "BETTER_AUTH_SECRET=secret123",
        "GH_SECRET=ghp_token",
        "POSTGRES_PASSWORD=password123",
      ];

      for (const envVar of envVars) {
        const error = `Config error: ${envVar}`;
        const sanitized = sanitizeErrorMessage(error);

        expect(sanitized).not.toContain(envVar);
        expect(sanitized).toContain("[REDACTED]");
      }
    });

    it("should remove Bearer tokens", () => {
      const error = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain("Bearer");
      expect(sanitized).toContain("[REDACTED]");
    });

    it("should remove stack traces", () => {
      const errorWithStack = `Error: Something went wrong
    at Function.test (/var/lib/piston/test.js:10:5)
    at Object.<anonymous> (/var/lib/piston/main.js:2:1)`;

      const sanitized = sanitizeErrorMessage(errorWithStack);

      // Should only keep first line
      expect(sanitized).toBe("Error: Something went wrong");
      expect(sanitized).not.toContain("at Function");
    });

    it("should handle errors without sensitive data", () => {
      const error = "Syntax error: Unexpected token";
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).toBe(error);
    });

    it("should handle empty strings", () => {
      const error = "";
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).toBe("");
    });

    it("should handle multiple sensitive patterns in one error", () => {
      const error = `Failed to read /etc/passwd with DATABASE_URL=postgresql://localhost`;
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain("/etc/passwd");
      expect(sanitized).not.toContain("DATABASE_URL");
      expect(sanitized).toContain("[REDACTED]");
    });
  });

  describe("truncateOutput", () => {
    it("should not truncate output within limit", () => {
      const output = "Hello, world!";
      const result = truncateOutput(output);

      expect(result.content).toBe(output);
      expect(result.truncated).toBe(false);
    });

    it("should truncate output exceeding limit", () => {
      const maxSize = CONSTRAINTS.MAX_OUTPUT_SIZE_BYTES;
      const largeOutput = "x".repeat(maxSize + 1000);
      const result = truncateOutput(largeOutput);

      expect(result.content.length).toBeLessThan(largeOutput.length);
      expect(result.truncated).toBe(true);
      expect(result.content).toContain("[Output truncated");
      expect(result.content).toContain("10MB limit]");
    });

    it("should preserve exact limit output", () => {
      const maxSize = CONSTRAINTS.MAX_OUTPUT_SIZE_BYTES;
      const exactOutput = "x".repeat(maxSize);
      const result = truncateOutput(exactOutput);

      expect(result.content).toBe(exactOutput);
      expect(result.truncated).toBe(false);
    });

    it("should include truncation message", () => {
      const maxSize = CONSTRAINTS.MAX_OUTPUT_SIZE_BYTES;
      const largeOutput = "x".repeat(maxSize + 1);
      const result = truncateOutput(largeOutput);

      expect(result.content).toMatch(/\[Output truncated - exceeded \d+MB limit\]/);
    });

    it("should handle empty output", () => {
      const result = truncateOutput("");

      expect(result.content).toBe("");
      expect(result.truncated).toBe(false);
    });
  });

  describe("sanitizePistonResult", () => {
    it("should sanitize all output fields", () => {
      const result = {
        stdout: "Output with /var/lib/piston/secret",
        stderr: "Error: DATABASE_URL=secret",
        output: "Combined /etc/passwd output",
        code: 0,
        signal: null,
      };

      const sanitized = sanitizePistonResult(result);

      expect(sanitized.stdout).not.toContain("/var/lib/piston");
      expect(sanitized.stderr).not.toContain("DATABASE_URL");
      expect(sanitized.output).not.toContain("/etc/passwd");
      expect(sanitized.code).toBe(0);
      expect(sanitized.signal).toBe(null);
    });

    it("should handle undefined fields", () => {
      const result = {
        code: 1,
        signal: null,
      };

      const sanitized = sanitizePistonResult(result);

      expect(sanitized.stdout).toBe("");
      expect(sanitized.stderr).toBe("");
      expect(sanitized.output).toBe("");
      expect(sanitized.code).toBe(1);
    });

    it("should truncate large outputs", () => {
      const maxSize = CONSTRAINTS.MAX_OUTPUT_SIZE_BYTES;
      const result = {
        stdout: "x".repeat(maxSize + 1),
        stderr: "",
        output: "",
        code: 0,
        signal: null,
      };

      const sanitized = sanitizePistonResult(result);

      expect(sanitized.stdout.length).toBeLessThan(result.stdout.length);
      expect(sanitized.stdout).toContain("[Output truncated");
    });

    it("should sanitize before truncating", () => {
      const maxSize = CONSTRAINTS.MAX_OUTPUT_SIZE_BYTES;
      const sensitiveData = "/var/lib/piston/secret".repeat(1000);
      const padding = "x".repeat(maxSize - sensitiveData.length + 100);
      const result = {
        stdout: sensitiveData + padding,
        stderr: "",
        output: "",
        code: 0,
        signal: null,
      };

      const sanitized = sanitizePistonResult(result);

      expect(sanitized.stdout).not.toContain("/var/lib/piston");
      expect(sanitized.stdout).toContain("[REDACTED]");
    });

    it("should preserve exit codes and signals", () => {
      const result = {
        stdout: "output",
        stderr: "error",
        output: "combined",
        code: 137,
        signal: "SIGKILL",
      };

      const sanitized = sanitizePistonResult(result);

      expect(sanitized.code).toBe(137);
      expect(sanitized.signal).toBe("SIGKILL");
    });

    it("should handle empty result", () => {
      const result = {
        code: 0,
        signal: null,
      };

      const sanitized = sanitizePistonResult(result);

      expect(sanitized).toEqual({
        stdout: "",
        stderr: "",
        output: "",
        code: 0,
        signal: null,
      });
    });
  });
});
