import { z } from "zod";

/**
 * Supported languages for code execution
 * Only these languages are allowed to prevent shell injection and other attacks
 */
export const SUPPORTED_LANGUAGES = [
  "javascript",
  "python",
] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Version constraints for each language
 * Maps language to allowed version patterns
 */
export const LANGUAGE_VERSIONS: Record<SupportedLanguages, string[]> = {
  javascript: ["20.11.1"],
  python: ["3.10.0", "3.11.0"],
};

/**
 * Security constraints
 */
export const CONSTRAINTS = {
  MAX_CODE_SIZE_BYTES: 100 * 1024, // 100KB per file
  MAX_OUTPUT_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  EXECUTION_TIMEOUT_MS: 10 * 1000, // 10 seconds
} as const;

/**
 * Piston execution input schema (multi-file support)
 * Validates all code execution requests
 */
export const pistonInputSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: "Version must be in semver format (e.g., 20.11.1)",
  }),
  files: z
    .array(
      z.object({
        name: z.string().min(1, "File name cannot be empty"),
        content: z
          .string()
          .min(1, "File content cannot be empty")
          .max(CONSTRAINTS.MAX_CODE_SIZE_BYTES, {
            message: `File content must be less than ${CONSTRAINTS.MAX_CODE_SIZE_BYTES / 1024}KB`,
          }),
      }),
    )
    .min(1, "At least one file is required"),
  stdin: z.string().optional().default(""),
  args: z.array(z.string()).optional().default([]),
});

export type PistonInput = z.infer<typeof pistonInputSchema>;

/**
 * Validates that the language version is supported
 */
export function isVersionSupported(
  language: SupportedLanguages,
  version: string,
): boolean {
  return LANGUAGE_VERSIONS[language].includes(version);
}

/**
 * Validates Piston input and returns detailed errors
 */
export function validatePistonInput(input: unknown): {
  success: boolean;
  data?: PistonInput;
  errors?: z.ZodError;
} {
  const result = pistonInputSchema.safeParse(input);

  if (!result.success) {
    return { success: false, errors: result.error };
  }

  // Additional validation: check version is supported
  if (!isVersionSupported(result.data.language, result.data.version)) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: "custom",
          path: ["version"],
          message: `Version ${result.data.version} is not supported for ${result.data.language}. Supported versions: ${LANGUAGE_VERSIONS[result.data.language].join(", ")}`,
        },
      ]),
    };
  }

  return { success: true, data: result.data };
}
