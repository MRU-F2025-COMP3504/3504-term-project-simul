import { headers } from "next/headers";
import * as React from "react";

import SignInButton from "~/components/auth/signin-button";
import SignOutButton from "~/components/auth/signout-button";
import { ThemeToggle } from "~/components/theme-toggle";
// Calls the server for authentication of session
import { auth } from "~/lib/auth";

export default async function Banner() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="flex h-16 flex-row justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold">Simul</div>

      </div>
      <div className="flex items-center gap-4">
        {session ? <SignOutButton /> : <SignInButton />}
        <ThemeToggle />
      </div>
    </header>
  );
}
