import { describe, expect, it } from "vitest";

import {
  CONSTRAINTS,
  isVersionSupported,
  LANGUAGE_VERSIONS,
  pistonInputSchema,
  SUPPORTED_LANGUAGES,
  validatePistonInput,
} from "~/lib/piston-validation";

describe("piston Input Validation", () => {
  describe("language Validation", () => {
    it("should accept supported languages", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "console.log('test');" }],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept all supported languages", () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        const versions = LANGUAGE_VERSIONS[lang];
        const validInput = {
          language: lang,
          version: versions[0],
          files: [{ name: "test.txt", content: "test" }],
        };

        const result = pistonInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      }
    });

    it("should reject unsupported languages", () => {
      const invalidInput = {
        language: "bash", // Not in allowlist
        version: "5.0.0",
        files: [{ name: "test.sh", content: "echo test" }],
      };

      const result = pistonInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("language");
      }
    });

    it("should reject empty language field", () => {
      const invalidInput = {
        language: "",
        version: "20.11.1",
        files: [{ name: "test.js", content: "console.log('test');" }],
      };

      const result = pistonInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject dangerous shell languages", () => {
      const dangerousLanguages = ["bash", "sh", "zsh", "powershell", "cmd"];

      for (const lang of dangerousLanguages) {
        const invalidInput = {
          language: lang,
          version: "1.0.0",
          files: [{ name: "test", content: "malicious code" }],
        };

        const result = pistonInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("file Validation", () => {
    it("should accept single file", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "main.js", content: "console.log('hello');" }],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept multiple files", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [
          { name: "index.js", content: "import { greet } from './utils.js';" },
          { name: "utils.js", content: "export const greet = () => {};" },
        ],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty files array", () => {
      const invalidInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [],
      };

      const result = pistonInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("At least one file");
      }
    });

    it("should reject files with empty names", () => {
      const invalidInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "", content: "test" }],
      };

      const result = pistonInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject files with empty content", () => {
      const invalidInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "" }],
      };

      const result = pistonInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject files exceeding size limit", () => {
      const largeContent = "a".repeat(CONSTRAINTS.MAX_CODE_SIZE_BYTES + 1);
      const invalidInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "large.js", content: largeContent }],
      };

      const result = pistonInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("100KB");
      }
    });

    it("should accept file at exact size limit", () => {
      const maxContent = "a".repeat(CONSTRAINTS.MAX_CODE_SIZE_BYTES);
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "max.js", content: maxContent }],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("version Validation", () => {
    it("should accept valid semver versions", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid version formats", () => {
      const invalidVersions = [
        "20.11", // Missing patch
        "20", // Missing minor and patch
        "v20.11.1", // Has 'v' prefix
        "20.11.1-beta", // Has prerelease tag
        "invalid", // Not a version
        "20.11.x", // Has wildcard
      ];

      for (const version of invalidVersions) {
        const invalidInput = {
          language: "javascript" as const,
          version,
          files: [{ name: "test.js", content: "test" }],
        };

        const result = pistonInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      }
    });

    it("should validate version is supported for language", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
      };

      const result = validatePistonInput(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject unsupported versions", () => {
      const invalidInput = {
        language: "javascript" as const,
        version: "99.99.99", // Not in LANGUAGE_VERSIONS
        files: [{ name: "test.js", content: "test" }],
      };

      const result = validatePistonInput(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors?.issues[0]?.message).toContain("not supported");
      }
    });
  });

  describe("optional Fields", () => {
    it("should accept stdin parameter", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
        stdin: "input data",
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stdin).toBe("input data");
      }
    });

    it("should default stdin to empty string", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stdin).toBe("");
      }
    });

    it("should accept args parameter", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
        args: ["--flag", "value"],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.args).toEqual(["--flag", "value"]);
      }
    });

    it("should default args to empty array", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
      };

      const result = pistonInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.args).toEqual([]);
      }
    });
  });

  describe("special Characters & Injection", () => {
    it("should handle code with quotes and escape sequences", () => {
      const specialCharsInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: "console.log(\"Test with \\\" quotes & symbols: <>&\");",
          },
        ],
      };

      const result = pistonInputSchema.safeParse(specialCharsInput);
      expect(result.success).toBe(true);
    });

    it("should handle Unicode characters", () => {
      const unicodeInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: "console.log(\"Hello 世界 🌍\");",
          },
        ],
      };

      const result = pistonInputSchema.safeParse(unicodeInput);
      expect(result.success).toBe(true);
    });

    it("should handle newlines and special whitespace", () => {
      const whitespaceInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [
          {
            name: "test.js",
            content: "line1\nline2\r\nline3\tindented",
          },
        ],
      };

      const result = pistonInputSchema.safeParse(whitespaceInput);
      expect(result.success).toBe(true);
    });
  });

  describe("isVersionSupported", () => {
    it("should return true for supported versions", () => {
      expect(isVersionSupported("javascript", "20.11.1")).toBe(true);
      expect(isVersionSupported("python", "3.10.0")).toBe(true);
    });

    it("should return false for unsupported versions", () => {
      expect(isVersionSupported("javascript", "99.99.99")).toBe(false);
      expect(isVersionSupported("python", "2.7.0")).toBe(false);
    });
  });

  describe("validatePistonInput", () => {
    it("should return success with valid data", () => {
      const validInput = {
        language: "javascript" as const,
        version: "20.11.1",
        files: [{ name: "test.js", content: "test" }],
      };

      const result = validatePistonInput(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("should return errors with invalid data", () => {
      const invalidInput = {
        language: "bash",
        version: "5.0.0",
        files: [],
      };

      const result = validatePistonInput(invalidInput);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
    });

    it("should validate version support", () => {
      const invalidInput = {
        language: "javascript" as const,
        version: "1.0.0", // Valid semver but not supported
        files: [{ name: "test.js", content: "test" }],
      };

      const result = validatePistonInput(invalidInput);
      expect(result.success).toBe(false);
      expect(result.errors?.issues[0]?.path).toContain("version");
    });
  });
});
