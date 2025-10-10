import type { NextRequest } from "next/server";

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";

/**
 * Middleware function to check for a valid session cookie in the incoming request.
 *
 * If the session cookie is not present, the user is redirected to the home page (`"/"`).
 * Otherwise, the request proceeds to the next middleware or handler.
 *
 * @param request - The incoming `NextRequest` object representing the HTTP request.
 * @returns A `NextResponse` that either redirects to the home page or allows the request to continue.
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * Configuration object for the middleware.
 *
 * Specifies that the middleware should only apply to requests matching the `/dashboard` path.
 * tl;dr: This middleware protects the `/dashboard` route by ensuring that only authenticated users can access it.
 */
export const config = {
  matcher: ["/dashboard"],
};
