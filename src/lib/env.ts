import { loadEnv } from "@matthew-hre/env";
import { z } from "zod";

const envSchema = {
  server: z.object({
    DATABASE_URL: z.url({
      protocol: /^postgres(ql)?:/,
    }).min(1, { message: "DATABASE_URL is required." }),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    POSTGRES_PORT: z.coerce.number().default(5432),

    POSTGRES_USER: z.string().min(1, { message: "POSTGRES_USER is required" }),
    POSTGRES_PASSWORD: z.string().min(1, { message: "POSTGRES_PASSWORD is required" }),
  }),
  client: z.object({}),
};

export type ServerEnvSchema = z.infer<typeof envSchema.server>;
export type ClientEnvSchema = z.infer<typeof envSchema.client>;

export const { serverEnv, clientEnv } = loadEnv(envSchema);
