import { describe, expect, it } from "vitest";

import { __test__ } from "../../src/lib/env";

const { envSchema } = __test__;

describe("envSchema.server", () => {
  const validEnv = {
    DATABASE_URL: "postgres://localhost:5432/mydb",
    NODE_ENV: "development",
    POSTGRES_PORT: 5432,
    POSTGRES_USER: "postgres",
    POSTGRES_PASSWORD: "secret",
    BETTER_AUTH_SECRET: "some-secret",
    BETTER_AUTH_URL: "https://auth.example.com",
    GH_CLIENT_ID: "gh-client-id",
    GH_SECRET: "gh-secret",
  };

  it("should pass with valid environment variables", () => {
    const result = envSchema.server.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it("should fai if DATABASE_URL is missing", () => {
    const invalidEnv: Partial<typeof validEnv> = { ...validEnv };
    delete invalidEnv.DATABASE_URL;

    const result = envSchema.server.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("DATABASE_URL is required");
    }
  });

  it("should fail if DATABASE_URL is not a postgres URL", () => {
    const invalidEnv = {
      ...validEnv,
      DATABASE_URL: "mysql://localhost:3306/mydb",
    };

    const result = envSchema.server.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("DATABASE_URL");
    }
  });

  it("should apply default for NODE_ENV", () => {
    const envWithoutNodeEnv: Partial<typeof validEnv> = { ...validEnv };
    delete envWithoutNodeEnv.NODE_ENV;

    const result = envSchema.server.parse(envWithoutNodeEnv);
    expect(result.NODE_ENV).toBe("development");
  });

  it("should coerce POSTGRES_PORT from string to number", () => {
    const envWithStringPort = { ...validEnv, POSTGRES_PORT: "5432" };
    const result = envSchema.server.parse(envWithStringPort);
    expect(result.POSTGRES_PORT).toBe(5432);
    expect(typeof result.POSTGRES_PORT).toBe("number");
  });

  it("should fail if GH_CLIENT_ID is empty", () => {
    const invalidEnv = { ...validEnv, GH_CLIENT_ID: "" };
    const result = envSchema.server.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("GH_CLIENT_ID is required");
    }
  });
});
