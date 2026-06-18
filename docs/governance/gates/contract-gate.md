# Contract Gate

## Purpose

Protect API, event, database, and integration contracts.

## Required evidence

- contract impact analysis
- RPC metadata with operation name, version, auth mode, audit class, and idempotency
- RBAC and ABAC policy mapping for protected contracts
- typed error model
- observability and audit mapping
- compatibility plan
- migration strategy when needed
- consumer impact note

## Fail conditions

- breaking change has no versioning
- RPC operation has no metadata
- mutation does not declare auth explicitly
- public contract declares permissions or tenant scope
- protected contract bypasses `RpcContextService`
- contract error is not represented in the typed error model
- migration is missing
- consumers are unknown
