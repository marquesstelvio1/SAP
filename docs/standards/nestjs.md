# Standard: NestJS 11

**Phase:** 4 — Engineering Standards

---

## Required

- Module-per-domain pattern (`module.ts`, `service.ts`, types)
- Dependency injection for all service dependencies
- Global exception filters for consistent error responses
- Guards for authentication and authorization
- Interceptors for logging, transformation, timing
- `enableShutdownHooks` for graceful shutdown
- All external configuration via `@saptm/config`

## Recommended

- Use `@nestjs/throttler` for rate limiting
- Use `@nestjs/cache-manager` for response caching
- Use pipes for input validation (Zod or class-validator)
- Use custom decorators for reusable concerns
- Test services with `node --test` and dependency injection

## Forbidden

- Direct Prisma usage in controllers — use service layer
- Business logic in module configuration
- Hardcoded configuration values
- Circular module imports
- `console.log` — Use structured logging via `@saptm/observability`

## Module Structure

```
domain/
├── domain.module.ts         # @Module decorator
├── domain.service.ts        # Business logic
├── domain.types.ts          # Module-specific types
└── ... handlers/adapters
```

## Validation

- Application starts without errors
- Swagger/OpenAPI spec is valid (when regenerated)
- All guards, pipes, interceptors execute in correct order
- Integration tests pass for each module

## Migration

- NestJS 11 breaking changes: check official migration guide
- Test all endpoints after framework upgrade
- Verify all decorators and guards still function correctly
