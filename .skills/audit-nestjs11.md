# Audit: NestJS 11

## Purpose
Verify `@saptm/api` conforms to NestJS 11 conventions: module structure, dependency injection, guard/interceptor/filter patterns, lifecycle hooks, and error handling.

## Inputs
- `apps/api/src/`
- `apps/api/nest-cli.json`
- `apps/api/tsconfig.json`
- `apps/api/package.json`

## Execution Steps

1. **Module structure compliance**:
   - Walk `apps/api/src/` — every domain module must contain: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, `<name>.types.ts`.
   - Flag any files outside domain module directories.
   - Verify `@Module()` decorator imports the correct controllers and providers.
   - Ensure `Global` modules are used sparingly and justified.

2. **Dependency injection patterns**:
   - Verify all providers use constructor injection with `@Injectable()` decorator.
   - Check for custom providers or factory providers — ensure they are documented and tested.
   - Validate circular dependency detection — `forwardRef()` must be used where circular references exist, and the justification must be documented.
   - Ensure `@Optional()` decorator is used for optional dependencies.

3. **Guard/interceptor/filter audit**:
   - Verify guards implement `CanActivate` interface.
   - Verify interceptors implement `NestInterceptor` interface.
   - Verify exception filters extend `BaseExceptionFilter` or implement `ExceptionFilter`.
   - Check that global guards/filters/interceptors are registered in `main.ts` or the root module.
   - Validate that RBAC guards reference `@saptm/auth/policy` for permission evaluation.
   - Ensure every guard uses the `evaluateAuthorization` engine (per Article II §2.2).

4. **Lifecycle hooks**:
   - Check services that manage external resources implement `OnModuleInit`, `OnModuleDestroy`, `OnApplicationShutdown`.
   - Validate graceful shutdown — verify `app.enableShutdownHooks()` is called in `main.ts`.
   - Ensure database connections, cache clients, and external service clients are closed in `OnModuleDestroy`.

5. **Error handling audit**:
   - Verify all controllers use `@HttpCode()`, `@HttpStatus` correctly.
   - Check that business logic errors throw typed NestJS exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`, etc.).
   - Ensure exception filters produce consistent JSON error responses (shape: `{ statusCode, message, error, timestamp, requestId }`).
   - Validate that unhandled rejections and uncaught exceptions are caught by the global filter.

6. **RPC integration audit**:
   - Verify every controller handler delegates to `@saptm/rpc` operations rather than direct HTTP endpoints.
   - Confirm DTOs/validators use Zod schemas from `@saptm/rpc` contracts.
   - Check that all routes are prefixed with `/api/*`.

7. **Configuration and environment**:
   - Verify `ConfigModule` is set up with validated env schema using `zod` or `Joi`.
   - Ensure `nest-cli.json` has correct `entryFile` and `tsConfigPath`.
   - Validate that the NestJS compilation uses `tsc` (not swc) for type safety.

## Validation Steps
- `turbo run build --filter=@saptm/api` passes.
- `turbo run test --filter=@saptm/api` passes (Node `--test` runner).
- `turbo run lint --filter=@saptm/api` passes.
- `turbo run typecheck --filter=@saptm/api` passes.
- Application starts without circular dependency warnings.
- All route handlers respond with consistent error shape on failure.

## Definition Of Done
- Every domain module has the canonical four files (`module`, `controller`, `service`, `types`).
- All injectable providers use constructor injection; no manual instantiation of providers.
- Guards, interceptors, and filters follow NestJS interfaces and are scoped appropriately.
- `enableShutdownHooks()` is called in `main.ts`; lifecycle hooks are implemented for external resources.
- All errors return structured JSON with `statusCode`, `message`, `timestamp`, `requestId`.
- Controllers delegate to RPC contracts; no raw HTTP endpoints.

## Failure Conditions
- Missing `<name>.types.ts` or `<name>.module.ts` in any domain module.
- Circular dependency detection warning during startup (without documented `forwardRef`).
- A guard does not use `evaluateAuthorization` from `@saptm/auth/policy`.
- `enableShutdownHooks()` is missing from bootstrap.
- Error response shape is inconsistent between endpoints.
- A controller handler bypasses `@saptm/rpc` and directly implements business logic.
- `turbo run build` fails for `@saptm/api`.

## Required Reports
- `reports/audit-nestjs11/module-structure.json` — per-module file compliance and any missing files.
- `reports/audit-nestjs11/dependency-injection.json` — providers list with injection patterns and circular dependency analysis.
- `reports/audit-nestjs11/guards-interceptors-filters.json` — registered guards/interceptors/filters with scope (global/controller/method) and permission evaluation details.
- `reports/audit-nestjs11/error-handling.json` — error response shape verification per endpoint.
- `reports/audit-nestjs11/summary.json` — pass/fail per step, total violations, remediation priority.
