import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, {message: "DATABASE_URL is required."}),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    POSTGRES_PORT: z.coerce.number().default(5432),
    
    //not sure how to make the ones for password and user
    POSTGRES_USER: z.string().min(1, {message: "POSTGRES_USER is required"}),
    POSTGRES_PASSWORD: z.string().min(1, {message: "POSTGRES_PASSWORD is required"}),

});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:", parsedEnv.error.format());
    throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;