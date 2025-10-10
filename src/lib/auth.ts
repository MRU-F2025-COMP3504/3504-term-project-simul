import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";
import { v4 as uuidv4 } from "uuid";

import { db } from "./db";
import * as schema from "./db/schema";
import { serverEnv } from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_SECRET,
    },
  },
  // We want to handle our own IDs, as we like UUIDs over Serials
  advanced: {
    database: {
      generateId: () => uuidv4(),
    },
  },
  plugins: [nextCookies()],
}); // make sure to import from better-auth/react

export const authClient = createAuthClient();
