"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "~/lib/auth";
import { actionClient } from "~/lib/safe-action";

const signInSchema = z.object({
  callbackURL: z.string().optional().default("/dashboard"),
});

/**
 * Initiates the GitHub OAuth sign-in flow.
 *
 * This action uses the provided callback URL to request a sign-in URL from the authentication API.
 * If successful, it redirects the user to the GitHub authentication page.
 * Throws an error if the sign-in URL cannot be retrieved.
 *
 * @param parsedInput An object containing the `callbackURL` to redirect to after authentication.
 * @throws {Error} If the sign-in URL is not returned from the authentication API.
 * @returns {void}
 */
export const signInWithGithubAction = actionClient
  .inputSchema(signInSchema)
  .action(async ({ parsedInput: { callbackURL } }) => {
    const { url } = await auth.api.signInSocial({
      headers: await headers(),
      body: {
        provider: "github",
        callbackURL,
      },
    });

    if (!url) {
      throw new Error("Failed to sign in with GitHub");
    }

    redirect(url);
  });

/**
 * Signs out the current user by calling the authentication API's `signOut` method
 * with the appropriate headers, then redirects to the home page.
 *
 * @returns {Promise<void>} Resolves when the sign-out and redirect are complete.
 */
export const signOutAction = actionClient.action(async () => {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
});
