# Performance Audit Plugin

**ID:** `performance-audit`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 65
**Mandatory:** true
**Runs On:** pre-release
**Blocking:** false

## Mission

Audit application performance across frontend, backend, database, and infrastructure layers.

## Audit Checklist

### 1. Frontend Performance

- [ ] Bundle size analyzed
- [ ] Code splitting implemented
- [ ] Lazy loading for routes and components
- [ ] Dynamic imports for heavy libraries
- [ ] Image optimization (next/image)
- [ ] Font optimization (next/font)
- [ ] No render-blocking resources
- [ ] Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] No unnecessary re-renders
- [ ] React.memo used appropriately
- [ ] useMemo/useCallback used appropriately

### 2. React Performance

- [ ] Server Components used by default
- [ ] Client Components minimized
- [ ] No useEffect for data fetching
- [ ] TanStack Query for server state
- [ ] Optimistic updates for mutations
- [ ] Proper cache invalidation
- [ ] No unnecessary context providers

### 3. Backend Performance

- [ ] Response times < 200ms (p95)
- [ ] No N+1 queries
- [ ] Database indexes on all foreign keys
- [ ] Query optimization (EXPLAIN ANALYZE)
- [ ] Pagination on list endpoints
- [ ] Caching strategy defined
- [ ] Connection pooling configured

### 4. Database Performance

- [ ] Prisma query analysis
- [ ] Missing indexes detected
- [ ] Slow queries identified
- [ ] Connection pool size adequate
- [ ] No full table scans on large tables
- [ ] Batch operations for bulk mutations

### 5. Cache Analysis

- [ ] HTTP caching headers configured
- [ ] CDN caching for static assets
- [ ] React Query cache configuration
- [ ] Server-side caching (Redis/memory)
- [ ] Cache invalidation strategy

### 6. Infrastructure

- [ ] Docker image size optimized
- [ ] Multi-stage builds
- [ ] Bundle analysis in CI
- [ ] Load testing results reviewed
- [ ] Autoscaling configured

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| PF01 | warning | Bundle size > 500KB |
| PF02 | warning | N+1 query detected |
| PF03 | info | Missing database index |
| PF04 | warning | No code splitting |
| PF05 | info | Slow query > 100ms |
| PF06 | warning | No pagination on list |
| PF07 | info | Missing caching |
| PF08 | warning | Unnecessary client component |
| PF09 | info | Large image not optimized |

## Output

Generate `performance-report.md` in `.ai/reports/`:

```markdown
# Performance Audit Report
**Date:** {date}

## Summary
- Status: PASS | WARNING | INFO
- Critical Issues: {n}
- Warnings: {n}
- Info: {n}

## Metrics
- Bundle Size: {size}
- API p95 Response: {time}
- Database Slow Queries: {n}
- Core Web Vitals: {status}

## Issues
{issues-list}

## Recommendations
1. {recommendation}
```

## Success Criteria

- Bundle size optimized
- No N+1 queries
- Database indexes present
- Core Web Vitals passing
- Caching implemented
