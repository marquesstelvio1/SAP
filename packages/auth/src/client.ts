import {
  type AuthClient,
  type BetterAuthClientOptions,
  createAuthClient,
} from "better-auth/client";

export function createSaptmAuthClient(baseURL?: string): AuthClient<BetterAuthClientOptions> {
  return createAuthClient({
    baseURL,
  });
}
