# ADR 0002 — Modular NestJS Before Microservices

## Status

Accepted.

## Decision

Start with a modular NestJS API and bounded-context modules before extracting microservices.

## Rationale

The project is greenfield. Premature microservices would increase operational overhead before domain boundaries and scale pressures are proven.

## Consequences

- Contexts are isolated as modules first.
- Contracts and events prepare future extraction.
- Service extraction requires a new ADR.

