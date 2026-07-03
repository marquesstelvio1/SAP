# Security Audit Report — Stage 7

> **Department:** Security (@enterprise-security)
> **Date:** 2026-07-03
> **Scope:** Billing, SSO, Teams, RPC Authorization, Webhooks, Rate Limiting

---

## Executive Summary

| Severity | Count | Critical |
|----------|-------|----------|
| 🔴 Critical | 1 | Missing SSO plan feature gate allows Free plan orgs to configure Enterprise-only SSO |
| 🟠 High | 2 | TwoFactorGuard not enforced on RPC; Webhook operations lack audit trail |
| 🟡 Medium | 2 | idpCertificate stored in plaintext; Rate limits 3x more permissive than spec |
| 🟢 Low | 2 | Hardcoded plan data in billing router; SSO test lacks plan check |
| **Total** | **7** | |

---

## Finding 1 — 🔴 CRITICAL: Missing SSO Plan Feature Gate

**Location:** `apps/api/src/sso/sso-rpc.router.ts` (all 3 handlers)
**STRIDE:** Elevation of Privilege

### Description
SSO endpoints (`sso.config.get`, `sso.config.update`, `sso.config.test`) only check for `tenant.manage` permission. They do **not** check whether the organization's plan includes SSO functionality (`hasSso` feature in `planLimitsSchema`). A Free plan user with `tenant.manage` can configure Enterprise-only SSO.

The `@PlanFeature()` decorator and `PlanGuard` exist in the codebase but are **never used** — they are NestJS HTTP guards and are never invoked for RPC handlers.

### Impact
Unauthorized orgs can configure SSO, bypassing Enterprise plan requirement. This is a direct bypass of the billing model.

### Fix
Add plan feature checking to the RPC authorization metadata system and enforce it in SSO handlers.

### Evidence
```typescript
// sso-rpc.router.ts — only checks permissions, no plan feature check
const authorizedContext = await deps.rpcContextService.authorizeRequest(
  context.request,
  updateSsoConfigMetadata,  // only has permissions: ["tenant.manage"]
);
```

---

## Finding 2 — 🟠 HIGH: TwoFactorGuard Not Enforced on RPC

**Location:** `apps/api/src/auth/guards/two-factor.guard.ts`
**STRIDE:** Spoofing

### Description
`TwoFactorGuard` is a NestJS HTTP guard (implements `CanActivate`), but billing, team, and SSO operations go through **oRPC**, not through HTTP controllers. The guard is **never instantiated or applied** anywhere in the codebase — it appears to exist as scaffolding only.

Admin users can perform `billing.checkout.create`, `billing.portal.create`, `team.member.add`, `sso.config.update` — all requiring `tenant.manage` — without 2FA verification.

### Impact
If an admin session is compromised, the attacker can change billing plans, add team members, or configure SSO without a second factor.

### Fix
Integrate 2FA enforcement into the RPC authorization flow in `rpc-context.service.ts`.

---

## Finding 3 — 🟠 HIGH: Billing Webhook Missing Audit Trail

**Location:** `apps/api/src/billing/billing.service.ts` (`handleWebhook` method)
**STRIDE:** Repudiation

### Description
The Stripe webhook handler (`handleWebhook`) updates subscription statuses, creates invoices, and changes plan assignments — but **none of these operations create audit records**. If a webhook is replayed (Stripe retries up to 3 times), or if a malicious webhook event is crafted (signature verified but data manipulated), there is no audit trail to detect or investigate.

### Impact
Billing changes are not auditable. Cannot detect replay attacks or unauthorized plan modifications.

### Fix
Add audit logging to all webhook mutation paths.

---

## Finding 4 — 🟡 MEDIUM: idpCertificate Stored in Plaintext

**Location:** `packages/database/prisma/schema.prisma` (SsoConfig model)
**STRIDE:** Information Disclosure

### Description
The `idpCertificate` field in `SsoConfig` is stored as a plain `String` with no encryption. The IdP certificate is a sensitive credential that can be used to assert trust relationships.

### Impact
If the database is compromised, IdP certificates are exposed in plaintext, allowing SSO impersonation.

### Fix
Add encryption/decryption for `idpCertificate` in the SSO repository layer.

---

## Finding 5 — 🟡 MEDIUM: Rate Limit Config Mismatch

**Location:** `apps/api/src/rate-limit/rate-limit.module.ts`
**STRIDE:** Denial of Service

### Description
The documented specification (AGENTS.md) defines:
- api: 200/min
- org: 1000/min
- user: 100/min

The actual implementation uses:
- api: 600/min (3x higher)
- org: 3000/min (3x higher)
- user: 300/min (3x higher)

### Impact
Rate limits are 3x more permissive than specified, increasing DoS vulnerability surface.

### Fix
Align rate limits with the specification.

---

## Finding 6 — 🟢 LOW: Hardcoded Plan Data in Billing Router

**Location:** `apps/api/src/billing/billing-rpc.router.ts` (lines 86-126)
**STRIDE:** Tampering

### Description
The `billing.plans` handler returns hardcoded plan data instead of querying the `PlansService`. This duplicated data can get out of sync with the database.

### Impact
Plan display may show incorrect pricing or features compared to what's enforced.

### Fix
Delegate to `PlansService.listPlans()`.

---

## Finding 7 — 🟢 LOW: SSO Test Lacks Plan Check

**Location:** `apps/api/src/sso/sso-rpc.router.ts` (`sso.test` handler)
**STRIDE:** Elevation of Privilege

### Description
The `sso.test` endpoint also doesn't check plan features, consistent with Finding 1 but lower severity since it's read-only test.

### Impact
Free plan orgs can test SSO connectivity even though they cannot use it.

---

## STRIDE Threat Model — New Features

### Billing

| Threat | Description | Mitigation | Status |
|--------|-------------|------------|--------|
| Spoofing | Impersonate another org's billing data | Tenant scoping via Prisma extension | ✅ |
| Tampering | Modify own plan tier | Audit trail (webhooks still missing) | ⚠️ (F3) |
| Repudiation | Deny changing subscription | Missing webhook audit | ❌ (F3) |
| Info Disclosure | Billing API leaks other orgs' data | Tenant scoping + permission check | ✅ |
| DoS | Flood billing endpoints | Rate limiting (needs tuning) | ⚠️ (F5) |
| Elevation | Access Enterprise features without plan | Missing plan gating in RPC | ❌ (F1, F2) |

### SSO

| Threat | Description | Mitigation | Status |
|--------|-------------|------------|--------|
| Spoofing | Impersonate via misconfigured SSO | IdP signed assertions (external) | ✅ |
| Tampering | Modify SSO config | Permission check + idempotency | ✅ |
| Repudiation | Deny changing SSO config | Audit trail | ✅ |
| Info Disclosure | Leak IdP credentials | Certificate stored in plaintext | ❌ (F4) |
| DoS | Flood SSO endpoints | Rate limiting | ✅ |
| Elevation | Configure SSO without Enterprise plan | **No plan gate** | ❌ (F1) |

### Teams

| Threat | Description | Mitigation | Status |
|--------|-------------|-----------|-------|
| Spoofing | Add self to another org's team | Tenant scoping | ✅ |
| Tampering | Change team member roles | Permission check + audit | ✅ |
| Repudiation | Deny adding/removing members | Audit trail | ✅ |
| Info Disclosure | List members of other orgs | Tenant scoping | ✅ |
| DoS | Flood team endpoints | Rate limiting | ✅ |
| Elevation | Grant admin role without permission | Permission check | ✅ |

---

## Quality Gates Status

| Gate | Status |
|------|--------|
| OWASP Top 10 review for new features | ✅ (see above) |
| Threat modeling documented (STRIDE) | ✅ |
| All inputs validated with Zod | ✅ |
| All mutations with tenant scoping | ⚠️ (webhooks use unique where, bypass extension) |
| Audit trail implemented | ⚠️ (webhooks missing) |
| Secrets management | ⚠️ (idpCertificate plaintext) |
| Dependencies cataloged and audited | ✅ |
| CI security gates passing | ✅ |
| Rate limiting configured | ⚠️ (mismatch with spec) |
| CORS, CSP, CSRF, security headers | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `packages/rpc/src/metadata.ts` | Added `planFeature` field to RPC metadata |
| `packages/rpc/src/sso.ts` | Added plan feature requirement to SSO metadata |
| `packages/rpc/src/billing.ts` | Added plan feature to billing sensitive operations |
| `apps/api/src/rpc/rpc-context.service.ts` | Added plan feature and 2FA checks |
| `apps/api/src/sso/sso-rpc.router.ts` | Added plan feature enforcement |
| `apps/api/src/billing/billing.service.ts` | Added audit logging to webhook handler |
| `apps/api/src/rate-limit/rate-limit.module.ts` | Aligned rate limits with spec |
| `packages/database/prisma/schema.prisma` | (no change needed — encryption handled in repo layer) |
| `apps/api/src/sso/infrastructure/prisma-sso.repository.ts` | Added field-level encryption for idpCertificate |

## Handoff Points

See `docs/handoffs/stage-7-security-to-performance.md` for:
- Rate limiting tuning (current vs spec)
- Security header status
- Security-vs-performance tradeoffs

---

*Audit completed by @enterprise-security*
