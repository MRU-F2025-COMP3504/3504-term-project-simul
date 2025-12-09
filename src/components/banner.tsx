import { headers } from "next/headers";
import Link from "next/link";
import * as React from "react";

import SignInButton from "~/components/auth/signin-button";
import { ThemeToggle } from "~/components/theme-toggle";
// Calls the server for authentication of session
import { auth } from "~/lib/auth";

import SignoutButton from "./auth/signout-button";
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
        <div className="flex items-center gap-6">
          <Button asChild variant="ghost" size="sm" className="px-0">
            <Link href="/">
              <Logo />
            </Link>
          </Button>
          {session && (
            <nav className={`
              hidden items-center gap-1
              md:flex
            `}
            >
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/courses">Courses</Link>
              </Button>
              {session.user.role === "instructor" && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/instructor/courses">My Courses</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/instructor">Studio</Link>
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session
            ? (
                <SignoutButton />
              )
            : (
                <SignInButton />
              )}
        </div>
      </div>
    </header>
  );
}
