"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "~/lib/auth";
import { actionClient } from "~/lib/safe-action";

const signInSchema = z.object({
  callbackURL: z.string().optional().default("/dashboard"),
});

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

export const signOutAction = actionClient.action(async () => {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
});
