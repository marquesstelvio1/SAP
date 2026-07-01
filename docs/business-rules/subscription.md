# Business Rules: Subscription

**Phase:** 3 — Business Rules Extraction
**Source:** Prisma schema (Subscription model), `apps/api/src/billing/`

---

## Subscription Model

| Field | Description |
|---|---|
| `plan` | Plan identifier (e.g., `free`, `pro`, `enterprise`) |
| `status` | Subscription status |
| `stripeCustomerId` | Stripe customer reference |
| `stripeSubscriptionId` | Stripe subscription reference |
| `currentPeriodStart` | Billing period start |
| `currentPeriodEnd` | Billing period end |
| `cancelAtPeriodEnd` | Scheduled cancellation flag |
| `trialEndsAt` | Trial expiration |

## Plan Definitions

| Plan | Likely Features |
|---|---|
| `free` | Limited features, basic support |
| `pro` | Full features, priority support |
| `enterprise` | Custom features, dedicated support |

**Note:** Plan definitions are managed in Stripe; exact feature sets not extracted from code.

## Subscription Lifecycle

```
trialing → active → past_due → canceled
              ↘        ↗
            (renewal) 
              ↘
            unpaid → canceled
```

## Feature Gating

- Subscription plan likely gates access to certain features
- Feature gating mechanism: NOT CONFIRMED from source code
- Usage limits per plan: Defined in Stripe metering

## TODO

- Feature gating implementation — NOT CONFIRMED
- Plan feature mapping — NOT DOCUMENTED
- Subscription status → platform access mapping — NOT CONFIRMED
- Trial period configuration — NOT CONFIRMED
