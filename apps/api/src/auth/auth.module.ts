import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { ObservabilityModule } from "../observability/observability.module.js";
import { AuthContextMiddleware } from "./auth-context.middleware.js";
import { AuthContextService } from "./auth-context.service.js";
import { AuthorizationGuard } from "./authorization.guard.js";
import { BetterAuthSessionService } from "./better-auth-session.service.js";
import { ServiceAccountAuthService } from "./service-account-auth.service.js";
import { SessionRequiredGuard } from "./session-required.guard.js";
import { UserAuthorizationService } from "./user-authorization.service.js";

@Module({
  imports: [ObservabilityModule],
  providers: [
    BetterAuthSessionService,
    ServiceAccountAuthService,
    UserAuthorizationService,
    AuthContextService,
    SessionRequiredGuard,
    AuthorizationGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthorizationGuard,
    },
  ],
  exports: [AuthContextService, SessionRequiredGuard, AuthorizationGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthContextMiddleware).forRoutes("*");
  }
}
