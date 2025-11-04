import { loadEnv } from "@matthew-hre/env";
import { z } from "zod";

const envSchema = {
  server: z.object({
    DATABASE_URL: z.url({
      protocol: /^postgres(ql)?/,
    }).min(1, { message: "DATABASE_URL is required." }),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    POSTGRES_PORT: z.coerce.number().default(5432),

    POSTGRES_USER: z.string().min(1, { message: "POSTGRES_USER is required" }),
    POSTGRES_PASSWORD: z.string().min(1, { message: "POSTGRES_PASSWORD is required" }),

    BETTER_AUTH_SECRET: z.string().min(1, { message: "BETTER_AUTH_SECRET is required" }),
    BETTER_AUTH_URL: z.url().min(1, { message: "BETTER_AUTH_URL is required" }),

    GH_CLIENT_ID: z.string().min(1, { message: "GH_CLIENT_ID is required" }),
    GH_SECRET: z.string().min(1, { message: "GH_SECRET is required" }),

    JUDGE0_URL: z.url().default("http://localhost:2358"),
  }),
  client: z.object({}),
};

export type ServerEnvSchema = z.infer<typeof envSchema.server>;
export type ClientEnvSchema = z.infer<typeof envSchema.client>;

export const { serverEnv, clientEnv } = loadEnv(envSchema);
