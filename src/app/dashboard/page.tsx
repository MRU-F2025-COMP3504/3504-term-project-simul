import Banner from "~/components/ui/banner";
import { headers } from "next/headers";

import SignoutButton from "~/components/auth/signout-button";
import { auth } from "~/lib/auth";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="p-4 text-2xl">
      <Banner />
      Hello!! Role:
      {" "}
      {session?.user?.role}
      <SignoutButton />
    </div>
  );
}
