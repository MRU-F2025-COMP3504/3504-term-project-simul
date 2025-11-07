import { headers } from "next/headers";
import Link from "next/link";
import * as React from "react";

import SignInButton from "~/components/auth/signin-button";
import { ThemeToggle } from "~/components/theme-toggle";
// Calls the server for authentication of session
import { auth } from "~/lib/auth";

import Logo from "./branding/logo";
import { Button } from "./ui/button";

export default async function Banner() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="bg-background sticky top-0 z-50 border-b">
      <div className={`
        container mx-auto flex h-16 items-center justify-between px-4
      `}
      >
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session
            ? (
                <Button asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )
            : (
                <SignInButton />
              )}
        </div>
      </div>
    </header>
  );
}
