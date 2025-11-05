"use server";

import { z } from "zod";

import type { PistonExecuteResponse } from "~/types/piston";

import { serverEnv } from "~/lib/env";
import { actionClient } from "~/lib/safe-action";

/**
 * Execute code using Piston
 *
 * Sends code to Piston API for execution in a sandboxed environment.
 * Supports multiple languages (JavaScript/Node.js, Python, etc.) as long as runtime is installed.
 * Can handle multiple files for complex projects.
 *
 * @example
 * Single file:
 * ```typescript
 * const result = await executeCode({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [{ name: "main.js", content: "console.log('Hello');" }],
 * });
 * ```
 *
 * Multiple files:
 * ```typescript
 * const result = await executeCode({
 *   language: "javascript",
 *   version: "20.11.1",
 *   files: [
 *     { name: "index.js", content: "import { greet } from './utils.js'; greet();" },
 *     { name: "utils.js", content: "export const greet = () => console.log('Hi');" }
 *   ],
 * });
 * ```
 */
export const executeCode = actionClient
  .inputSchema(
    z.object({
      language: z.string(),
      version: z.string(),
      files: z.array(
        z.object({
          name: z.string(),
          content: z.string(),
        }),
      ).min(1, "At least one file is required"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { language, version, files } = parsedInput;

    try {
      const response = await fetch(`${serverEnv.PISTON_URL}/api/v2/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          version,
          files,
        }),
      });

      if (!response.ok) {
        let errorBody: string | undefined;
        try {
          errorBody = await response.text();
        }
        catch {
          errorBody = undefined;
        }
        throw new Error(
          `Piston API error: ${response.status} ${response.statusText}${
            errorBody ? `\nResponse body: ${errorBody}` : ""}`,
        );
      }

      const data = (await response.json()) as PistonExecuteResponse;

      return {
        success: true,
        output: data.run.output,
        stdout: data.run.stdout,
        stderr: data.run.stderr,
        exitCode: data.run.code,
      };
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
