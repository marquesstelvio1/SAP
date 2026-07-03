# Analytics Event Taxonomy — SAPTM

**Version:** 1.1.0
**Last Updated:** 2026-07-02
**Owner:** Product Team

---

## Platform

PostHog (self-hosted or cloud) — configured via `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

## Event Naming Convention

Format: `{domain}:{action}[:{context]`

Examples:
- `cargo:created`
- `tracking:searched:by_tracking_number`
- `auth:signed_in:with_2fa`

## Instrumentation Status

| Status | Significado |
|--------|-------------|
| ✅ Instrumentado | `capture()` implementado em produção |
| 🔲 Em falta | Evento definido mas não instrumentado |
| 🚫 Não aplicável | Funcionalidade ainda não existe (ex: billing sem Stripe) |

---

## Event Catalog

### Authentication

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `auth:signed_up` | method, org_id | User completes sign-up | 🚫 Não aplicável (sem signup) | P0 |
| `auth:signed_in` | method, has_2fa, org_id | User signs in | ✅ `sign-in-form.tsx` | — |
| `auth:signed_out` | org_id | User signs out | 🔲 Em falta | P2 |
| `auth:password_reset_requested` | org_id | User requests password reset | 🔲 Em falta | P1 |
| `auth:password_reset_completed` | org_id | User completes password reset | 🔲 Em falta | P1 |
| `auth:2fa_enabled` | method (totp/backup), org_id | User enables 2FA | 🔲 Em falta (`mfa-enrollment-form.tsx`) | P2 |
| `auth:2fa_disabled` | org_id | User disables 2FA | 🔲 Em falta (`mfa-enrollment-form.tsx`) | P2 |

### Cargo

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `cargo:created` | org_id, cargo_type, origin_region, destination_region | Cargo registered | ✅ `cargo-register-form.tsx` | — |
| `cargo:status_changed` | org_id, from_status, to_status, cargo_id | Cargo status transitions | ✅ Múltiplos forms | — |
| `cargo:searched` | org_id, search_type, result_count | Cargo search executed | 🔲 Em falta (sem search UI) | P2 |
| `cargo:exported` | org_id, format, count | Cargo data export | 🔲 Em falta | P2 |
| `cargo:claim_filed` | org_id, cargo_id, claim_type | Cargo claim filed | 🔲 Em falta | P1 |
| `cargo:claim_resolved` | org_id, cargo_id, resolution | Cargo claim resolved | ✅ `cargo-claim-settlement-record-form.tsx` | — |

### Tracking

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `tracking:shipment_checked` | org_id, method | Shipment tracking lookup | 🔲 Em falta (tracking overview) | P1 |
| `tracking:event_received` | org_id, event_type | Tracking event ingested | ✅ `tracking-event-record-form.tsx` | — |
| `tracking:exception_raised` | org_id, exception_type, severity | Tracking exception created | ✅ `tracking-exception-manage-form.tsx` | — |
| `tracking:exception_resolved` | org_id, exception_id | Tracking exception resolved | ✅ `tracking-exception-resolve-form.tsx` | — |

### Planning

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `planning:order_created` | org_id | Transport order created | ✅ `transport-order-confirm-form.tsx` | — |
| `planning:order_dispatched` | org_id, driver_id | Transport order dispatched | ✅ `transport-order-dispatch-form.tsx` | — |
| `planning:order_completed` | org_id, on_time | Transport order completed | 🔲 Em falta | P2 |

### Capacity

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `capacity:resource_created` | org_id, resource_type | Capacity resource created | ✅ `capacity-resource-register-form.tsx` | — |
| `capacity:slot_booked` | org_id, resource_id | Capacity slot reserved | ✅ `capacity-slot-reserve-form.tsx` | — |
| `capacity:slot_cancelled` | org_id, resource_id | Capacity slot cancelled | ✅ `capacity-slot-cancel-form.tsx` | — |
| `capacity:advisory_checked` | org_id, result | Capacity advisory queried | ✅ `capacity-advisory-decision-form.tsx`, `capacity-pre-check.tsx` | — |

### Billing

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `billing:checkout_started` | org_id, plan_id | Checkout session initiated | 🚫 Sem Stripe ainda | P0 |
| `billing:checkout_completed` | org_id, plan_id, amount | Payment successful | 🚫 Sem Stripe ainda | P0 |
| `billing:checkout_failed` | org_id, plan_id, reason | Payment failed | 🚫 Sem Stripe ainda | P0 |
| `billing:portal_opened` | org_id | Billing portal opened | 🚫 Sem Stripe ainda | P0 |
| `billing:subscription_changed` | org_id, from_plan, to_plan | Plan changed | 🚫 Sem Stripe ainda | P0 |

### Settings & Admin

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `settings:org_updated` | org_id, changed_fields | Organization settings changed | 🔲 Em falta (settings pages existem) | P1 |
| `settings:member_invited` | org_id, role | Team member invited | ✅ `admin-user-invite-form.tsx` | — |
| `settings:member_removed` | org_id | Team member removed | ✅ `admin-membership-status-form.tsx` | — |
| `settings:role_created` | org_id | Custom role created | ✅ `admin-role-create-form.tsx` | — |
| `settings:integration_connected` | org_id, integration_type | External integration connected | ✅ `integration-service-account-create-form.tsx` | — |
| `settings:integration_disconnected` | org_id, integration_type | External integration disconnected | 🔲 Em falta | P2 |

### Tariff

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `tariff:quote_calculated` | org_id, total_amount | Tariff quote calculated | ✅ `tariff-quote-calculate-form.tsx` | — |
| `tariff:quote_approved` | org_id, quote_id | Tariff quote approved | ✅ `tariff-quote-approve-form.tsx` | — |
| `tariff:rate_rule_added` | org_id, rule_type | Rate rule added | ✅ `tariff-rate-rule-add-form.tsx` | — |
| `tariff:rate_card_registered` | org_id, currency | Rate card registered | ✅ `tariff-rate-card-register-form.tsx` | — |

### General

| Event | Properties | Trigger | Status | Prioridade |
|-------|-----------|---------|--------|------------|
| `page:viewed` | path, title, referrer | Page view (automatic) | ✅ `analytics-provider.tsx` | — |
| `feature:used` | feature_name, org_id | New feature used for first time | 🔲 Em falta | P2 |
| `error:encountered` | error_type, page, org_id | Client-side error caught | 🔲 Em falta (error boundaries) | P1 |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Instrumentado | 22 |
| 🔲 Em falta | 11 |
| 🚫 Não aplicável (funcionalidade não existe) | 5 |
| **Total** | **38** |

### Eventos a instrumentar com maior prioridade (Sprint A)

1. `auth:password_reset_requested` — P1 (forgot-password page existe)
2. `auth:password_reset_completed` — P1 (reset-password page existe)
3. `cargo:claim_filed` — P1 (claim form existe)
4. `tracking:shipment_checked` — P1 (tracking overview existe)
5. `settings:org_updated` — P1 (settings pages existem)
6. `error:encountered` — P1 (error boundaries existem)
7. `auth:signed_out` — P2
8. `auth:2fa_enabled` — P2
9. `auth:2fa_disabled` — P2
10. `cargo:searched` — P2 (sem search UI ainda)
11. `cargo:exported` — P2
12. `planning:order_completed` — P2
13. `settings:integration_disconnected` — P2
14. `feature:used` — P2

---

## Implementation

### PostHog Setup (já implementado)

- `apps/web/lib/analytics.ts` — `initAnalytics()`, `captureEvent()`, `identifyUser()`, `resetAnalytics()`
- `apps/web/components/analytics-provider.tsx` — `AnalyticsProvider` wrapped in root layout
- `apps/web/hooks/use-capture-event.ts` — Hook que injeta automaticamente `organizationId` nos eventos
- `apps/web/app/layout.tsx` — `<AnalyticsProvider>` no root layout

### Como adicionar um novo evento

1. Verificar se o evento está definido na taxonomia acima
2. No componente client, importar `useCaptureEvent`:
```typescript
import { useCaptureEvent } from "@/hooks/use-capture-event";

function MyForm() {
  const capture = useCaptureEvent();

  return (
    <form onSubmit={() => {
      capture("cargo:status_changed", {
        from_status: "registered",
        to_status: "released",
        cargo_id: id,
      });
    }}>
      ...
    </form>
  );
}
```

3. Para eventos em server components, usar `captureEvent` diretamente:
```typescript
import { captureEvent } from "@/lib/analytics";

// Apenas em client components!
captureEvent("auth:signed_in", { method: "email", has_2fa: false, org_id });
```
