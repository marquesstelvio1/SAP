import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const authHandler = async (request: Request) => {
  const { createSaptmAuthFromEnv } = await import("@saptm/auth/server");
  return createSaptmAuthFromEnv().handler(request);
};

export const { GET, POST } = toNextJsHandler(authHandler);
