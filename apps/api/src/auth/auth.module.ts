import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { ObservabilityModule } from "../observability/observability.module.js";
import { AuthContextMiddleware } from "./auth-context.middleware.js";
import { AuthContextService } from "./auth-context.service.js";
import { TenantContextMiddleware } from "./tenant-context.middleware.js";
import { AuthorizationGuard } from "./authorization.guard.js";
import { BetterAuthSessionService } from "./better-auth-session.service.js";
import { AUTH_REPOSITORY } from "./domain/auth.repository.js";
import { PrismaAuthRepository } from "./infrastructure/prisma-auth.repository.js";
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
    TenantContextMiddleware,
    SessionRequiredGuard,
    AuthorizationGuard,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    {
      provide: APP_GUARD,
      useExisting: AuthorizationGuard,
    },
  ],
  exports: [AuthContextService, SessionRequiredGuard, AuthorizationGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Order matters: AuthContextMiddleware resolves the auth context,
    // then TenantContextMiddleware uses it to set up the AsyncLocalStorage.
    consumer.apply(AuthContextMiddleware, TenantContextMiddleware).forRoutes("*");
  }
}
