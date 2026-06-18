# `@saptm/config`

Runtime configuration and environment validation package.

Current status:

- Server and client environment schemas exist.
- Runtime parsing is used by the API bootstrap.
- Trusted CORS origins are derived from Better Auth, web URL, and explicit API origins.

Implementation must use `.env.example` as the public contract and must not commit secrets.
