# Business Rules: Billing & Subscription

**Phase:** 3 — Business Rules Extraction
**Source:** `apps/api/src/billing/`, Prisma schema

---

## Subscription Rules

| Rule | Value |
|---|---|
| Payment provider | Stripe |
| Default plan | `free` |
| Plan options | Defined via Stripe products |
| Subscription statuses | `active`, `past_due`, `canceled`, `unpaid`, `trialing`, `incomplete` |
| Trial | Configurable via Stripe |

## Billing Operations

| Operation | Description |
|---|---|
| Create checkout session | Redirect to Stripe checkout |
| Create portal session | Redirect to Stripe customer portal |
| View plans | List available plans |
| View overview | Current subscription, invoices, usage |
| Stripe webhook | Handle subscription lifecycle events |

## Invoice Rules

| Rule | Value |
|---|---|
| Invoice source | Stripe |
| Default currency | EUR |
| Invoice statuses | Stripe-defined |
| Download URL | Stripe-hosted PDF |

## Usage Tracking

| Rule | Value |
|---|---|
| Metrics tracked | Per-organization |
| Period | Monthly (Stripe alignment) |
| Storage | UsageRecord model |
| Limits | Per-plan configuration (Stripe metering) |

## Webhook Processing

Stripe webhook events handled:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## TODO

- Webhook event signature verification — NOT CONFIRMED
- Webhook idempotency — NOT CONFIRMED (risk of duplicate charges)
- Usage-based billing enforcement — NOT CONFIRMED
- Plan downgrade/upgrade effects — NOT DOCUMENTED
