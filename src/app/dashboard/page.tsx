import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SignoutButton from "~/components/auth/signout-button";
import { auth } from "~/lib/auth";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.role) {
    redirect("/onboarding");
  }

  return (
    <div className="p-4 text-2xl">
      Hello!! Role:
      {" "}
      {session.user.role}
      <SignoutButton />
    </div>
  );
}
