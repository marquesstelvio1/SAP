import { Global, Module } from "@nestjs/common";

import { createCsrfMiddleware } from "./csrf.middleware.js";
import { applySecurityHeaders } from "./security-headers.js";

export const CSRF_MIDDLEWARE = "CSRF_MIDDLEWARE";
export const SECURITY_HEADERS_MIDDLEWARE = "SECURITY_HEADERS_MIDDLEWARE";

@Global()
@Module({
  providers: [
    {
      provide: SECURITY_HEADERS_MIDDLEWARE,
      useValue: applySecurityHeaders,
    },
    {
      provide: CSRF_MIDDLEWARE,
      useFactory: () =>
        createCsrfMiddleware({
          excludedPaths: ["/health", "/api/auth", "/billing/webhook"],
        }),
    },
  ],
  exports: [SECURITY_HEADERS_MIDDLEWARE, CSRF_MIDDLEWARE],
})
export class SecurityModule {}
