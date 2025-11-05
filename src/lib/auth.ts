import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { adminClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { createAuthClient } from "better-auth/react";
import { v4 as uuidv4 } from "uuid";

import { db } from "./db";
import * as schema from "./db/schema";
import { serverEnv } from "./env";

// Define access control
const statement = {
  course: ["create", "read", "update", "delete"],
  lesson: ["create", "read", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

// Define roles
const student = ac.newRole({
  course: ["read"],
  lesson: ["read"],
});

const instructor = ac.newRole({
  course: ["create", "read", "update", "delete"],
  lesson: ["create", "read", "update", "delete"],
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
      banned: {
        type: "boolean",
      },
      banReason: {
        type: "string",
      },
      banExpires: {
        type: "date",
      },
    },
  },
  socialProviders: {
    github: {
      clientId: serverEnv.GH_CLIENT_ID,
      clientSecret: serverEnv.GH_SECRET,
    },
  },
  // We want to handle our own IDs, as we like UUIDs over Serials
  advanced: {
    database: {
      generateId: () => uuidv4(),
    },
  },
  plugins: [
    nextCookies(),
    admin({
      ac,
      roles: {
        student,
        instructor,
      },
    }),
  ],
}); // make sure to import from better-auth/react

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        student,
        instructor,
      },
    }),
  ],
});
