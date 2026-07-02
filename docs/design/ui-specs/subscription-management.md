# UI Spec: Subscription Management

> **Departamento:** Visual Design
> **Tipo:** UI Specification
> **Data:** 2026-07-02
> **Prioridade:** Média (Sprint B)

## 1. Purpose

Allow users to view and manage their subscription plan, compare plans, and upgrade/downgrade.

## 2. Plan Cards Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  Planos disponíveis                                                │
│  ──────────────────────────────────────────────────────────────    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Free       │  │ ⭐ Pro       │  │  Enterprise  │            │
│  │              │  │  (Popular)   │  │              │            │
│  │  Grátis      │  │  99€/mês     │  │  Sob consulta│            │
│  │──────────────│  │──────────────│  │──────────────│            │
│  │ ✓ 50 cargas  │  │ ✓ 500 cargas│  │ ✓ Ilimitado  │            │
│  │ ✓ 1k tracking│  │ ✓ 10k track │  │ ✓ Ilimitado  │            │
│  │ ✓ 5 membros  │  │ ✓ 50 membros│  │ ✓ Ilimitado  │            │
│  │ ✗ Equipas    │  │ ✓ Equipas   │  │ ✓ Equipas    │            │
│  │ ✗ API        │  │ ✓ API       │  │ ✓ API        │            │
│  │ ✗ SSO        │  │ ✗ SSO       │  │ ✓ SSO/SAML   │            │
│  │              │  │              │  │              │            │
│  │ [✓ Plan atual]│  │ [Upgrade]   │  │ [Contactar]  │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└────────────────────────────────────────────────────────────────────┘
```

## 3. Current Plan Detail Card

When viewing the current active subscription:

```
┌────────────────────────────────────────────────────────────┐
│ 💳 Subscrição Ativa                        [Status Badge]  │
│ Plano Pro                                                 │
│ ────────────────────────────────────────────────────────   │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Período atual:  01/06/2026 → 30/06/2026             │  │
│  │ Próxima cobrança: 99,00 € em 30/06/2026             │  │
│  │ Método de pagamento: Visa ***4242                    │  │
│  │                                                      │  │
│  │ [Gerir subscrição → Stripe Customer Portal]          │  │
│  │ [Alterar plano]  [Cancelar subscrição]               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                           │
│  Features incluídas no Pro:                               │
│  ┌──────────┬───────────┬───────────┬───────────┐        │
│  │ Cargas   │ Tracking  │ Membros   │ API       │        │
│  │ 500/mês  │ 10k/mês   │ 50        │ ✅        │        │
│  └──────────┴───────────┴───────────┴───────────┘        │
└────────────────────────────────────────────────────────────┘
```

## 4. States

### Free Plan
- 3 plan cards showing Free as "Current plan" (highlighted border)
- Pro and Enterprise have "Upgrade" / "Contact" CTAs

### Pro Active
- Current plan detail card shown
- "Change plan" opens plan comparison modal
- "Manage subscription" portal redirect

### Enterprise
- Custom plan card with no pricing details shown
- "Contact sales" CTA

### Canceled (grace period)
- Plan detail card with warning:
  ```
  ⚠️ A sua subscrição foi cancelada.
  Acesso mantido até 30/06/2026.
  [Reativar subscrição]
  ```

### Past Due
- Warning banner at top of page (persistent, dismissable only when resolved):
  ```
  ⚠️ Falha no pagamento. Atualize o método de pagamento para evitar interrupção.
  [Atualizar pagamento]
  ```

## 5. Feature Comparison Modal

Reuse the existing `PlanComparisonModal` at:
`apps/web/app/(platform)/app/settings/billing/plan-comparison-modal.tsx`

The modal shows all features in a table format by plan tier. Features are labelled in PT-PT operational language.

## 6. Key Components Needed

| Component | Type | Status |
|-----------|------|--------|
| `PlanCard` | Custom | 🔴 New — reusable card for plan display |
| `PlanBadge` | Badge variant | 🔴 New — "Free"/"Pro"/"Enterprise" |
| `PricingFeatureRow` | Custom | 🟡 Optional — feature comparison line |
| `PlanComparisonModal` | Existing | ✅ Done — with plan badges |
