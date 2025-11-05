import { eq } from "drizzle-orm";
import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { user } from "~/lib/db/schema";

import OnboardingClient from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  if (session.user.role !== "user") {
    redirect("/dashboard");
  }

  async function handleRoleSelect(role: "student" | "instructor") {
    "use server";

    // we need to hit this again in the action context
    const session = await getSession();

    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // the user's role can't be updated by our auth api directly,
    // so we perform the update here
    await db.update(user).set({ role }).where(eq(user.id, userId));
  }

  return <OnboardingClient onSelectRoleAction={handleRoleSelect} />;
}

async function getSession() {
  "use server";

  const headers = await nextHeaders();
  return auth.api.getSession({ headers });
}
