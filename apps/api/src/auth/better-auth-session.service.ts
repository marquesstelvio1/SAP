import { Injectable } from "@nestjs/common";
import type { BetterAuthSessionResult, GetBetterAuthSessionInput } from "@saptm/auth";
import { createSaptmAuthFromEnv } from "@saptm/auth/server";

@Injectable()
export class BetterAuthSessionService {
  private readonly auth = createSaptmAuthFromEnv();

  async getSession(input: GetBetterAuthSessionInput): Promise<BetterAuthSessionResult> {
    const result = await this.auth.api.getSession({
      headers: input.headers,
      query: {
        ...(input.query?.disableCookieCache === undefined
          ? {}
          : { disableCookieCache: input.query.disableCookieCache }),
        ...(input.query?.disableRefresh === undefined
          ? {}
          : { disableRefresh: input.query.disableRefresh }),
      },
    });

    return result as BetterAuthSessionResult;
  }
}
