import { defineConfig } from "drizzle-kit";

import { serverEnv } from "~/lib/env";

export default defineConfig({
  out: "./src/lib/db/migrations",
  schema: "./src/lib/db/schema/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {

    url: serverEnv.DATABASE_URL!,
  },
});
