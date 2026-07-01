# Analytics Event Taxonomy — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Owner:** Product Team

---

## Platform

PostHog (self-hosted or cloud) — configured via `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

## Event Naming Convention

Format: `{domain}:{action}[:{context}]`

Examples:
- `cargo:created`
- `tracking:searched:by_tracking_number`
- `auth:signed_in:with_2fa`

## Event Catalog

### Authentication

| Event | Properties | Trigger |
|-------|-----------|---------|
| `auth:signed_up` | method, org_id | User completes sign-up |
| `auth:signed_in` | method, has_2fa, org_id | User signs in |
| `auth:signed_out` | org_id | User signs out |
| `auth:password_reset_requested` | org_id | User requests password reset |
| `auth:password_reset_completed` | org_id | User completes password reset |
| `auth:2fa_enabled` | method (totp/backup), org_id | User enables 2FA |
| `auth:2fa_disabled` | org_id | User disables 2FA |

### Cargo

| Event | Properties | Trigger |
|-------|-----------|---------|
| `cargo:created` | org_id, cargo_type, origin_region, destination_region | Cargo registered |
| `cargo:status_changed` | org_id, from_status, to_status, cargo_id | Cargo status transitions |
| `cargo:searched` | org_id, search_type, result_count | Cargo search executed |
| `cargo:exported` | org_id, format, count | Cargo data export |
| `cargo:claim_filed` | org_id, cargo_id, claim_type | Cargo claim filed |
| `cargo:claim_resolved` | org_id, cargo_id, resolution | Cargo claim resolved |

### Tracking

| Event | Properties | Trigger |
|-------|-----------|---------|
| `tracking:shipment_checked` | org_id, method | Shipment tracking lookup |
| `tracking:event_received` | org_id, event_type | Tracking event ingested |
| `tracking:exception_raised` | org_id, exception_type, severity | Tracking exception created |
| `tracking:exception_resolved` | org_id, exception_id | Tracking exception resolved |

### Planning

| Event | Properties | Trigger |
|-------|-----------|---------|
| `planning:order_created` | org_id | Transport order created |
| `planning:order_dispatched` | org_id, driver_id | Transport order dispatched |
| `planning:order_completed` | org_id, on_time | Transport order completed |

### Capacity

| Event | Properties | Trigger |
|-------|-----------|---------|
| `capacity:resource_created` | org_id, resource_type | Capacity resource created |
| `capacity:slot_booked` | org_id, resource_id | Capacity slot reserved |
| `capacity:slot_cancelled` | org_id, resource_id | Capacity slot cancelled |
| `capacity:advisory_checked` | org_id, result | Capacity advisory queried |

### Billing

| Event | Properties | Trigger |
|-------|-----------|---------|
| `billing:checkout_started` | org_id, plan_id | Checkout session initiated |
| `billing:checkout_completed` | org_id, plan_id, amount | Payment successful |
| `billing:checkout_failed` | org_id, plan_id, reason | Payment failed |
| `billing:portal_opened` | org_id | Billing portal opened |
| `billing:subscription_changed` | org_id, from_plan, to_plan | Plan changed |

### Settings & Admin

| Event | Properties | Trigger |
|-------|-----------|---------|
| `settings:org_updated` | org_id, changed_fields | Organization settings changed |
| `settings:member_invited` | org_id, role | Team member invited |
| `settings:member_removed` | org_id | Team member removed |
| `settings:role_created` | org_id | Custom role created |
| `settings:integration_connected` | org_id, integration_type | External integration connected |
| `settings:integration_disconnected` | org_id, integration_type | External integration disconnected |

### General

| Event | Properties | Trigger |
|-------|-----------|---------|
| `page:viewed` | path, title, referrer | Page view (automatic) |
| `feature:used` | feature_name, org_id | New feature used for first time |
| `error:encountered` | error_type, page, org_id | Client-side error caught |

---

## Implementation

### PostHog Setup

Create `apps/web/lib/analytics.ts`:
```typescript
'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function initAnalytics() {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll capture manually
      loaded: (ph) => {
        if (process.env.NODE_ENV !== 'production') {
          ph.debug();
        }
      },
    });
  }
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}

export function resetAnalytics() {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.reset();
  }
}

export { PostHogProvider };
```

Create `apps/web/components/analytics-provider.tsx`:
```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PostHogProvider, initAnalytics, captureEvent } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname) {
      captureEvent('page:viewed', {
        path: pathname,
        search: searchParams?.toString(),
      });
    }
  }, [pathname, searchParams]);

  return <PostHogProvider>{children}</PostHogProvider>;
}
```
