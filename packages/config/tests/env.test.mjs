import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clientEnvSchema, parseServerEnv, serverEnvSchema } from "../dist/index.js";

describe("serverEnvSchema", () => {
  it("parses a valid minimal env with defaults", () => {
    const result = serverEnvSchema.parse({
      DATABASE_URL: "postgresql://localhost:5432/saptm",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
    });

    assert.equal(result.NODE_ENV, "development");
    assert.equal(result.API_PORT, 4000);
    assert.equal(result.DATABASE_POOL_SIZE, 10);
    assert.equal(result.LOG_LEVEL, "info");
    assert.equal(result.OTEL_SERVICE_NAME, "saptm");
    assert.equal(result.EMAIL_FROM, "noreply@saptm.pt");
    assert.equal(result.SAPTM_INVITATION_TOKEN_TTL_HOURS, 48);
  });

  it("rejects short BETTER_AUTH_SECRET", () => {
    assert.throws(() =>
      serverEnvSchema.parse({
        DATABASE_URL: "postgresql://localhost:5432/saptm",
        BETTER_AUTH_SECRET: "too-short",
        BETTER_AUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
      }),
    );
  });

  it("rejects invalid NODE_ENV", () => {
    assert.throws(() =>
      serverEnvSchema.parse({
        NODE_ENV: "staging",
        DATABASE_URL: "postgresql://localhost:5432/saptm",
        BETTER_AUTH_SECRET: "a".repeat(32),
        BETTER_AUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
      }),
    );
  });

  it("rejects non-url DATABASE_URL", () => {
    assert.throws(() =>
      serverEnvSchema.parse({
        DATABASE_URL: "not-a-url",
        BETTER_AUTH_SECRET: "a".repeat(32),
        BETTER_AUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
      }),
    );
  });

  it("parses comma-separated CORS origins", () => {
    const result = serverEnvSchema.parse({
      DATABASE_URL: "postgresql://localhost:5432/saptm",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
      API_CORS_ORIGINS: "https://app.example.com, https://admin.example.com",
    });

    assert.deepEqual(result.API_CORS_ORIGINS, [
      "https://app.example.com",
      "https://admin.example.com",
    ]);
  });

  it("parses empty CORS origins as empty array", () => {
    const result = serverEnvSchema.parse({
      DATABASE_URL: "postgresql://localhost:5432/saptm",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
    });

    assert.deepEqual(result.API_CORS_ORIGINS, []);
  });
});

describe("parseServerEnv", () => {
  it("returns parsed env for valid input", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://localhost:5432/saptm",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
    });

    assert.equal(env.NODE_ENV, "development");
    assert.equal(env.BETTER_AUTH_SECRET, "a".repeat(32));
  });

  it("throws with descriptive message when required vars are missing", () => {
    assert.throws(() => parseServerEnv({}), {
      message: /Missing environment variables/,
    });
  });
});

describe("clientEnvSchema", () => {
  it("parses valid client env", () => {
    const result = clientEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
    });

    assert.equal(result.NEXT_PUBLIC_APP_URL, "http://localhost:3000");
    assert.equal(result.NEXT_PUBLIC_API_URL, "http://localhost:4000");
  });

  it("rejects missing required client vars", () => {
    assert.throws(() => clientEnvSchema.parse({}));
  });
});
