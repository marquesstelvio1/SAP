# Testing Rules

1. Every critical mutation needs success, forbidden, validation, and audit tests.
2. Every API contract needs input, output, and error tests.
3. Every tenant-scoped query needs cross-tenant denial tests.
4. Every integration write needs idempotency tests.
5. Every UI workflow needs accessibility coverage once UI implementation starts.
6. Do not merge release-critical code without CI evidence.

