# Rule R02: Never Access Prisma Directly from Controllers/RPC Handlers

**Purpose:** Enforce separation of concerns — controllers handle I/O, services handle business logic.

**Allowed:**
- Accessing Prisma through service classes
- Using `@saptm/database` package exports from services
- Repository pattern within `@saptm/database` package

**Forbidden:**
- Importing Prisma client directly in RPC handlers or controllers
- Database queries in RPC handler functions
- Business logic in RPC handler functions

**Validation:**
- Code review must verify service layer usage
- No direct `@prisma/client` imports in `apps/api/src/` outside service files
- Biome import rules could enforce this

**Failure Consequences:**
- PR rejection
- Refactoring required before merge

**Severity:** error
