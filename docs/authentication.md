# Authentication with Better Auth

## How Our Authentication Works

Our authentication system has several key pieces working together:

1. **Better Auth** - The main authentication library
2. **GitHub OAuth** - Users sign in with their GitHub account
3. **Database Storage** - User sessions and account info stored in PostgreSQL
4. **Middleware Protection** - Automatically protects certain pages
5. **Server Actions** - Handle sign-in/sign-out logic

## Core Concepts

### Sessions and Cookies

When a user signs in, Better Auth creates a **session**: think of it like a temporary ID card that proves they're logged in. This session is stored as a **cookie** in the user's browser, so they stay logged in even when they refresh the page.

### OAuth with GitHub

Instead of managing passwords ourselves (which is complex and risky), we use **OAuth** to let users sign in with their existing GitHub account. This is safer and more convenient for users.

### Protected Routes

Some pages in our app should only be accessible to logged-in users. We use **middleware** to automatically check if someone is signed in before they can view protected pages.

## File Structure

Here's where authentication-related code lives in our project:

```text
src/
├── lib/
│   ├── auth.ts                    # Better Auth configuration
│   └── db/schema/auth.ts          # Database tables for users/sessions
├── actions/
│   └── auth-actions.ts            # Sign-in/sign-out server actions
├── components/auth/
│   ├── signin-button.tsx          # GitHub sign-in button
│   └── signout-button.tsx         # Sign-out button
├── middleware.ts                  # Route protection
└── app/api/auth/[...all]/
    └── route.ts                   # Authentication API endpoints
```

## Setting Up Authentication

### 1. Environment Variables

Authentication requires several environment variables. Add these to your `.env.local` file:

```bash
# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"
```

The secret key can be generated with (on Unix systems):

```bash
openssl rand -base64 32
```

### 2. GitHub OAuth Setup

To get the GitHub credentials:

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local`

Or, the secret 5th step: Bug Matt for his credentials.

### 3. Database Schema

Our authentication uses these database tables (already set up in `src/lib/db/schema/auth.ts`):

- **user** - Stores user profile information
- **session** - Tracks active user sessions
- **account** - Links users to their OAuth accounts
- **verification** - Handles email verification (if needed)

If it's the first time setting up, run the migration to create these tables:

```bash
pnpm db:push
```

Make sure you indicate that all those tables are new, and not renamed. This is only an issue if you ran on the legacy `database` branch.

## Using Authentication in Components

> Note: We have two different auth clients, an `auth` and an `authClient`. The `auth` client is **server-side**, and requires us to use `auth.api` to access its methods. The `authClient` is **client-side** and can be used directly.

### Sign-In Button

The sign-in button redirects users to GitHub for authentication:

```tsx
import SignInButton from "~/components/auth/signin-button";

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Our App</h1>
      <SignInButton callbackURL="/dashboard" />
    </div>
  );
}
```

### Sign-Out Button

The sign-out button ends the user's session:

```tsx
import SignoutButton from "~/components/auth/signout-button";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SignoutButton />
    </div>
  );
}
```

### Checking Authentication Status

To check if someone is signed in, use the Better Auth client:

```tsx
"use client";

import { authClient } from "~/lib/auth";

export default function ProfilePage() {
  const {
    data: session,
    isPending, // loading state
    error, // error object
    refetch // refetch the session
  } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to view this page.</div>;
  }

  return (
    <div>
      <h1>
        Welcome,
        {session.user.name}
        !
      </h1>
      <p>
        Email:
        {session.user.email}
      </p>
    </div>
  );
}
```

Or, if you don't want to use the hook:

```tsx
import { authClient } from "~/lib/auth";

const { data: session, error } = await authClient.getSession();
```

## Server-Side Authentication

### Getting User Info in Server Components

For server components and API routes, get the current session like this:

```tsx
import { headers } from "next/headers";

import { auth } from "~/lib/auth";

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>Not signed in</div>;
  }

  return (
    <div>
      <h1>
        Server-side user:
        {session.user.name}
      </h1>
    </div>
  );
}
```

### Protected API Routes

Protect API routes by checking for a valid session:

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "~/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // User is authenticated, proceed with API logic
  return NextResponse.json({
    message: `Hello, ${session.user.name}!`,
  });
}
```

## Route Protection

### Middleware Protection

Our middleware automatically protects certain routes. Currently, it protects `/dashboard`:

```typescript
// src/middleware.ts
export const config = {
  matcher: ["/dashboard"], // Add more protected routes here
};
```

To protect additional routes, add them to the `matcher` array:

```typescript
export const config = {
  matcher: ["/dashboard", "/profile", "/settings"],
};
```

### Page-Level Protection

For more complex protection logic, check authentication in the page component:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/lib/auth";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/"); // Redirect to home page
  }

  // Rest of your page component
  return <div>Protected content here</div>;
}
```

## Common Patterns

### Loading States

Always handle loading states when checking authentication:

```tsx
"use client";

import { useSession } from "better-auth/react";

import SignInButton from "~/components/auth/signin-button";

export default function AuthAwareComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div>
      {session
        ? (
            <p>
              Welcome back,
              {session.user.name}
              !
            </p>
          )
        : (
            <SignInButton />
          )}
    </div>
  );
}
```
