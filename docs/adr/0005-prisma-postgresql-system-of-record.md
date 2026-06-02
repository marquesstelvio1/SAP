# ADR 0005 — PostgreSQL and Prisma as System of Record

## Status

Accepted.

## Decision

Use PostgreSQL as the transactional system of record and Prisma for schema, migrations, and generated database access.

## Rationale

The logistics domain requires relational integrity, transactions, indexing, auditability, and long-lived operational records.

## Consequences

- Every schema change requires Prisma migration governance.
- Tenant scoping and auditability are mandatory.
- High-volume operational events may later be partitioned or extracted.

