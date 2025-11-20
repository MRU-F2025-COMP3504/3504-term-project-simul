import { headers } from "next/headers";

import SignoutButton from "~/components/auth/signout-button";
import Banner from "~/components/banner";
import { auth } from "~/lib/auth";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="my-4">
            Hello
            {" "}
            {session?.user?.name}
            , your role is
            {" "}
            "
            {session?.user?.role}
            "
          </p>
          <SignoutButton />
        </div>
      </main>
    </div>
  );
}
