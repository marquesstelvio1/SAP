import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/plugins/two-factor";

export function createSaptmAuthClient(baseURL?: string) {
  return createAuthClient({
    ...(baseURL === undefined ? {} : { baseURL }),
    plugins: [twoFactorClient()],
  });
}

export type SaptmAuthClient = ReturnType<typeof createSaptmAuthClient>;
