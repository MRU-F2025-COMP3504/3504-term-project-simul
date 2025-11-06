import type { NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";

import { auth } from "~/lib/auth";

/**
 * Middleware function to check for authentication and role-based access control.
 *
 * - `/dashboard` routes: Require authentication + role
 * - `/onboarding` routes: Require authentication + no role
 * - Unauthenticated users are redirected to home (`/`)
 *
 * @param request - The incoming `NextRequest` object representing the HTTP request.
 * @returns A `NextResponse` that redirects or allows the request to continue.
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathname = request.nextUrl.pathname;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check user session and role
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const hasRole = session.user.role && session.user.role !== "user";

    if (pathname.startsWith("/dashboard")) {
      // dashboard requires a role
      if (!hasRole) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
    else if (pathname.startsWith("/onboarding")) {
      // onboarding requires NO role (or "user" role indicating unassigned)
      if (hasRole) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }
  catch (error) {
    // If session validation fails, redirect to home
    console.error("Session validation failed in middleware:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * Configuration object for the middleware.
 *
 * Specifies that the middleware should apply to requests matching the `/dashboard` and `/onboarding` paths.
 * tl;dr: This middleware protects routes by ensuring proper authentication and role states.
 */
export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
  runtime: "nodejs",
};
