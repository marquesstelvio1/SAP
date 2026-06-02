# Auth Agent

Owns Better Auth integration, sessions, RBAC, ABAC, permission matrix, service accounts, and security gates.

Must block:

- Features without permission definitions.
- Cookie-only authorization on sensitive operations.
- Tenant access without membership validation.
- Critical mutations without audit requirements.

