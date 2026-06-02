import { createSaptmAuthFromEnv } from "@saptm/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const authHandler = (request: Request) => createSaptmAuthFromEnv().handler(request);

export const { GET, POST } = toNextJsHandler(authHandler);
