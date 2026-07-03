# UI Spec: Billing Overview Page

> **Departamento:** Visual Design
> **Tipo:** UI Specification
> **Data:** 2026-07-02
> **Prioridade:** Alta (Sprint A)

## 1. Purpose

Display subscription details, usage meters, recent invoices, and upgrade/management CTAs for the organization's billing.

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Faturação                                                   │
│  Subscrição, planos e faturas da organização                 │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 💳 Subscrição                      [Status Badge]      │  │
│  │ Plano Pro                                              │  │
│  │ ────────────────────────────────────────────────────   │  │
│  │ Período atual: 01/06/2026 - 30/06/2026                 │  │
│  │                                                        │  │
│  │ [Gerir subscrição] [Comparar planos]                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Cargas       │  │ Tracking     │  │ Membros      │       │
│  │ 42 / 500     │  │ 2.340 /  10k │  │ 12 / 50      │       │
│  │ ███████░░ 8% │  │ ██████░░ 23%│  │ ██░░░░░░ 24% │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  Faturas Recentes                                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Data          │ Valor  │ Estado    │ Paga em  │       │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 01/06-30/06  │ 99,00 €│ Paga      │ 01/06    │ DL   │  │
│  │ 01/05-31/05  │ 99,00 €│ Paga      │ 01/05    │ DL   │  │
│  │ 01/04-30/04  │ 99,00 €│ Pendente  │ -        │ DL   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 3. States

### Free Plan State
```
┌────────────────────────────────────────────────────────────┐
│ 💳 Subscrição                       [Free]                 │
│ Plano Free                                                │
│ ────────────────────────────────────────────────────       │
│ Nenhuma subscrição ativa. Configure o seu plano.           │
│                                                            │
│ [Fazer upgrade] [Comparar planos]                          │
└────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Cargas       │  │ Tracking     │  │ Membros      │
│ 28 / 50      │  │ 845 / 1.000 │  │ 3 / 5       │
│ ████████░ 56%│  │ ████████░ 85%│  │ ██████░░ 60%│
│ ⚠️ Próximo  │  │ ⚠️ Próximo  │  │              │
│ do limite    │  │ do limite    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Past Due State
```
┌────────────────────────────────────────────────────────┐
│ ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️│
│ ⚠️ Pagamento vencido — atualize o método de pagamento  │
│ ⚠️ para evitar interrupção do serviço.                 │
│ ⚠️ [Atualizar pagamento]                               │
│ ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️│
└────────────────────────────────────────────────────────┘
```

### Canceled State
```
┌────────────────────────────────────────────────────────┐
│ 💳 Subscrição                  [Cancelado]             │
│ Plano Pro                                              │
│ ────────────────────────────────────────────────────   │
│ A subscrição foi cancelada. Os dados serão mantidos    │
│ até ao final do período atual (30/06/2026).            │
│                                                        │
│ [Reativar subscrição]                                  │
└────────────────────────────────────────────────────────┘
```

## 4. Usage Meter Component (UsageMeter)

A new component based on `Radix Progress` with enhanced styling:

```tsx
interface UsageMeterProps {
  label: string;
  current: number;
  limit: number;
  format?: "number" | "percentage";
  showWarning?: boolean;
}
```

| Usage Range | Visual | 
|-------------|--------|
| 0-79% | `--color-success` (green) |
| 80-99% | `--color-warning` (yellow/amber) |
| 100%+ | `--color-destructive` (red) |

The meter bar shows a tooltip with exact counts on hover.

## 5. Empty State (No Usage Data)

```tsx
<AccessState
  badgeLabel="Faturação"
  title="Sem dados de uso"
  description="As métricas de uso aparecerão aqui quando disponíveis."
  variant="empty"
/>
```

## 6. Key Components Needed

| Component | Type | Status |
|-----------|------|--------|
| `UsageMeter` | Custom (Radix Progress wrapper) | 🔴 New |
| `PlanBadge` | shadcn Badge variant extension | 🔴 New |
| `InvoiceTable` | shadcn DataTable with invoice columns | 🟡 Reuse |
| `PlanComparisonModal` | Existing | ✅ Done |
