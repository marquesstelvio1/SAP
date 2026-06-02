# ADR 0004 — oRPC Contract-First API

## Status

Accepted.

## Decision

Use oRPC contracts as the typed boundary between Next.js and NestJS.

## Rationale

The platform requires typed contracts, explicit auth metadata, error models, and compatibility governance across frontend and backend.

## Consequences

- Contracts live in `@saptm/rpc`.
- Implementations live in `apps/api`.
- Contract changes require review and tests.

