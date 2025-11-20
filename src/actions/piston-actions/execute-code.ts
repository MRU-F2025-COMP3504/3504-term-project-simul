"use server";

import { serverEnv } from "~/lib/env";
import {
  sanitizeErrorMessage,
  sanitizePistonResult,
} from "~/lib/piston-sanitization";
import {
  pistonInputSchema,
  validatePistonInput,
} from "~/lib/piston-validation";
import { actionClient } from "~/lib/safe-action";

/**
 * Calls the Piston API
 */
async function executePistonAPI(input: {
  language: string;
  version: string;
  files: Array<{ name: string; content: string }>;
  stdin?: string;
  args?: string[];
}) {
  const response = await fetch(`${serverEnv.PISTON_URL}/api/v2/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Piston API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Execute code using Piston in a sandboxed environment
 *
 * Validates input, executes code via Piston API, and sanitizes output.
 * Supports multiple languages and files.
 *
 * Security: All inputs are validated against allowed languages/versions.
 * All outputs are sanitized to remove sensitive information.
 *
 * @see docs/actions.md for security constraints and usage examples
 *
 * @example Single file execution
 * ```typescript
 * const result = await executePistonCode({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [{ name: "main.js", content: "console.log('Hello, world!');" }],
 * });
 *
 * if (result.serverError) {
 *   console.error("Execution failed:", result.serverError);
 * } else {
 *   console.log("Output:", result.data?.output);
 * }
 * ```
 *
 * @example Multi-file execution
 * ```typescript
 * const result = await executePistonCode({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [
 *     { name: "index.js", content: "import { greet } from './utils.js'; greet();" },
 *     { name: "utils.js", content: "export const greet = () => console.log('Hi');" },
 *   ],
 * });
 * ```
 */
export const executePistonCode = actionClient
  .inputSchema(pistonInputSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Validate input and check version support
      const validation = validatePistonInput(parsedInput);
      if (!validation.success) {
        throw new Error(
          validation.errors?.issues[0]?.message ?? "Validation failed",
        );
      }

      // Execute via Piston API
      const result = await executePistonAPI({
        language: parsedInput.language,
        version: parsedInput.version,
        files: parsedInput.files,
        stdin: parsedInput.stdin,
        args: parsedInput.args,
      });

      // Sanitize the result before returning to client
      const sanitized = sanitizePistonResult(result.run);

      return {
        success: true,
        output: sanitized.output,
        stdout: sanitized.stdout,
        stderr: sanitized.stderr,
        exitCode: sanitized.code,
      };
    }
    catch (error) {
      // Sanitize error messages to prevent info leakage
      const message
        = error instanceof Error
          ? sanitizeErrorMessage(error.message)
          : "Code execution failed";

      throw new Error(message);
    }
  });
