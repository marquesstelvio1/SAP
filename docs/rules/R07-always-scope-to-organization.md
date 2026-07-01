# Rule R07: Always Scope Queries to Organization

**Purpose:** Prevent cross-tenant data leaks.

**Allowed:**
- Filtering all queries by `organizationId`
- Using `authContext.organizationId` for data access
- Prisma middleware for automatic scoping (when implemented)
- Cross-org queries only with explicit admin permission

**Forbidden:**
- Querying domain data without `organizationId` filter
- Accessing data from other organizations
- Using global queries that ignore tenant context
- Sharing data between organizations without authorization

**Validation:**
- Code review must verify `organizationId` filter on all queries
- Integration tests must verify cross-tenant isolation
- Prisma middleware enforcement (when implemented)
- Audit log for cross-org access attempts

**Failure Consequences:**
- Critical data leak
- GDPR/compliance violation
- Immediate security incident

**Severity:** critical
