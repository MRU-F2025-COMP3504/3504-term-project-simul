import { beforeAll, describe, expect, it } from "vitest";

import { executePistonCode } from "~/actions/piston-actions/execute-code";
import { serverEnv } from "~/lib/env";

import { expectedBehaviors, maliciousCodeSamples } from "../fixtures/malicious-code";

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

describe("file System Access Prevention", () => {
  it("should prevent reading /etc/passwd (JavaScript)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.fileSystemAccess.javascriptReadPasswd,
        },
      ],
    });

    if (result.serverError) {
      // Error is acceptable - means it was blocked
      expect(result.serverError).toBeTruthy();
      return;
    }

    // If it executed, output should NOT contain /etc/passwd contents
    const output = result.data?.output || result.data?.stderr || "";

    for (const forbidden of expectedBehaviors.fileSystemAccess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }

    // Should contain error/denial message
    const hasExpected = expectedBehaviors.fileSystemAccess.shouldContain.some(
      text => output.includes(text),
    );
    expect(hasExpected).toBeTruthy();
  });

  it("should prevent directory listing (JavaScript)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.fileSystemAccess.javascript,
        },
      ],
    });

    const output = result.data?.output || result.data?.stderr || "";

    for (const forbidden of expectedBehaviors.fileSystemAccess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }
  });

  it("should prevent file system access (Python)", async () => {
    const result = await executePistonCode({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "test.py",
          content: maliciousCodeSamples.fileSystemAccess.python,
        },
      ],
    });

    const output = result.data?.output || result.data?.stderr || "";

    for (const forbidden of expectedBehaviors.fileSystemAccess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }
  });
});

describe("environment Variable Protection", () => {
  it("should not expose environment variables (JavaScript)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.environmentAccess.javascript,
        },
      ],
    });

    const output = result.data?.output || result.data?.stdout || "";

    for (const secret of expectedBehaviors.environmentAccess.shouldNotContain) {
      expect(output).not.toContain(secret);
    }
  });

  it("should not expose specific secrets (JavaScript)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.environmentAccess.javascriptSpecificVars,
        },
      ],
    });

    const output = result.data?.output || result.data?.stdout || "";

    for (const secret of expectedBehaviors.environmentAccess.shouldNotContain) {
      expect(output).not.toContain(secret);
    }
  });

  it("should not expose environment variables (Python)", async () => {
    const result = await executePistonCode({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "test.py",
          content: maliciousCodeSamples.environmentAccess.python,
        },
      ],
    });

    const output = result.data?.output || result.data?.stdout || "";

    for (const secret of expectedBehaviors.environmentAccess.shouldNotContain) {
      expect(output).not.toContain(secret);
    }
  });
});

describe("child Process Prevention", () => {
  it("should prevent child process spawning (JavaScript exec)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.childProcess.javascript,
        },
      ],
    });

    const output = result.data?.output || result.data?.stderr || "";

    for (const forbidden of expectedBehaviors.childProcess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }

    const hasError = expectedBehaviors.childProcess.shouldContain.some(
      text => output.includes(text),
    );
    expect(hasError).toBeTruthy();
  });

  it("should prevent child process spawning (JavaScript spawn)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.childProcess.javascriptSpawn,
        },
      ],
    });

    const output = result.data?.output || result.data?.stderr || "";

    for (const forbidden of expectedBehaviors.childProcess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }
  });

  it("should prevent subprocess (Python)", async () => {
    const result = await executePistonCode({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "test.py",
          content: maliciousCodeSamples.childProcess.python,
        },
      ],
    });

    const output = result.data?.output || result.data?.stderr || "";

    for (const forbidden of expectedBehaviors.childProcess.shouldNotContain) {
      expect(output).not.toContain(forbidden);
    }
  });
});

describe("network Access Restriction", () => {
  it("should block network requests (JavaScript fetch)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.networkRequest.javascript,
        },
      ],
    });

    const output = (
      result.data?.output
      || result.data?.stderr
      || result.data?.stdout
      || ""
    ).toLowerCase();

    const hasFailed = expectedBehaviors.networkRequest.shouldContain.some(
      text => output.includes(text.toLowerCase()),
    );
    expect(hasFailed).toBeTruthy();
  });

  it("should block network requests (JavaScript https)", async () => {
    const result = await executePistonCode({
      language: "javascript",
      version: "20.11.1",
      files: [
        {
          name: "test.js",
          content: maliciousCodeSamples.networkRequest.javascriptHttps,
        },
      ],
    });

    const output = (
      result.data?.output
      || result.data?.stderr
      || result.data?.stdout
      || ""
    ).toLowerCase();

    const hasFailed = expectedBehaviors.networkRequest.shouldContain.some(
      text => output.includes(text.toLowerCase()),
    );
    expect(hasFailed).toBeTruthy();
  });

  it("should block network requests (Python)", async () => {
    const result = await executePistonCode({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "test.py",
          content: maliciousCodeSamples.networkRequest.python,
        },
      ],
    });

    const output = (
      result.data?.output
      || result.data?.stderr
      || result.data?.stdout
      || ""
    ).toLowerCase();

    const hasFailed = expectedBehaviors.networkRequest.shouldContain.some(
      text => output.includes(text.toLowerCase()),
    );
    expect(hasFailed).toBeTruthy();
  });
});
