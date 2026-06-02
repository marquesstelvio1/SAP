# Security Rules

1. Every feature must declare required permissions before implementation.
2. Every mutation must run server-side authorization.
3. Every tenant-scoped read must enforce tenant and membership scope.
4. Every critical mutation must create an audit record.
5. Better Auth sessions identify actors; platform policies authorize actions.
6. Cookie-only auth checks are allowed only for optimistic redirects.
7. Service accounts must use scoped credentials and idempotency rules.
8. Report exports must enforce role, scope, classification, and audit.

