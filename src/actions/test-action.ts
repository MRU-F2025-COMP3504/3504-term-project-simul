"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { actionClient } from "~/lib/safe-action";

const inputSchema = z.object({
  message: z.string().min(1),
});

export const sendTestMessage = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { message } }) => {
    if (message) {
      // eslint-disable-next-line no-console
      console.log("Message:", message);

      return {
        serverResponse: `Server got: "${message}"`,
      };
    }

    return returnValidationErrors(inputSchema, { _errors: ["Message is required"] });
  });
