# Visual Design Audit — SAPTM

**Date:** 2026-06-30
**Department:** Visual Design
**Scope:** Token coverage, component visual specs, ASCII mockups (8 pages), component-per-page tables, spacing/grid system, color usage map, inconsistency report, recommendations
**Platform:** SAP Transportation Management — NestJS 11 + Next.js 16 + shadcn/ui (new-york) + Tailwind v4 + @saptm/ui

---

## Table of Contents

1. [Token Coverage Audit](#1-token-coverage-audit)
2. [Component Visual Specs](#2-component-visual-specs)
3. [Spacing & Grid System](#3-spacing--grid-system)
4. [Color Usage Map](#4-color-usage-map)
5. [ASCII Mockups — 8 Pages](#5-ascii-mockups--8-pages)
6. [Component-Per-Page Specification Tables](#6-component-per-page-specification-tables)
7. [Design System Inconsistency Report](#7-design-system-inconsistency-report)
8. [Recommendations (P0–P3)](#8-recommendations-p0p3)

---

## 1. Token Coverage Audit

### 1.1 `@theme inline` — Complete Token Inventory

Source: `packages/ui/src/styles/globals.css` lines 158-253

#### COLOR TOKENS

| Token | CSS Variable | Status | Usage Count | Notes |
|---|---|---|---|---|
| `--color-background` | `--background` | ✅ USED | ~30x | Body, cards, shells |
| `--color-foreground` | `--foreground` | ✅ USED | ~40x | Text, headings |
| `--color-card` | `--card` | ✅ USED | ~80x | All `<Card>` instances |
| `--color-card-foreground` | `--card-foreground` | ✅ USED | ~15x | Card title text |
| `--color-popover` | `--popover` | ✅ USED | ~12x | Dropdowns, sheets, dialogs |
| `--color-popover-foreground` | `--popover-foreground` | ✅ USED | ~8x | Popover text |
| `--color-primary` | `--primary` | ✅ USED | ~25x | Buttons, badges, links |
| `--color-primary-foreground` | `--primary-foreground` | ✅ USED | ~20x | Primary button text |
| `--color-secondary` | `--secondary` | ✅ USED | ~15x | Secondary badges, buttons |
| `--color-secondary-foreground` | `--secondary-foreground` | ✅ USED | ~10x | Secondary text |
| `--color-muted` | `--muted` | ✅ USED | ~35x | Muted backgrounds |
| `--color-muted-foreground` | `--muted-foreground` | ✅ USED | ~120x | Labels, descriptions, secondary text |
| `--color-accent` | `--accent` | ✅ USED | ~18x | Hover states, accent backgrounds |
| `--color-accent-foreground` | `--accent-foreground` | ✅ USED | ~10x | Accent text |
| `--color-destructive` | `--destructive` | ✅ USED | ~22x | Error, delete, critical states |
| `--color-destructive-foreground` | `--destructive-foreground` | ✅ USED | ~5x | Destructive button text |
| `--color-border` | `--border` | ✅ USED | ~50x | Card borders, table rows, inputs |
| `--color-input` | `--input` | ✅ USED | ~12x | Input field borders |
| `--color-ring` | `--ring` | ✅ USED | ~15x | Focus rings |
| `--color-success` | `--success` | ✅ USED | ~18x | Success badges, positive trends |
| `--color-success-foreground` | `--success-foreground` | ✅ USED | ~5x | Success badge text |
| `--color-warning` | `--warning` | ✅ USED | ~12x | Warning badges, delay indicators |
| `--color-warning-foreground` | `--warning-foreground` | ✅ USED | ~3x | Warning badge text |
| `--color-risk` | `--risk` | ✅ USED | ~3x | Risk/hazard indicators |
| `--color-risk-foreground` | `--risk-foreground` | ❌ UNUSED | 0 | Defined but never referenced |
| `--color-info` | `--info` | ✅ USED | ~6x | Info badges, context badges |
| `--color-info-foreground` | `--info-foreground` | ✅ USED | ~2x | Info badge text |
| `--color-chart-1` | `--chart-1` | ✅ USED | ~3x | Chart.js/Recharts series |
| `--color-chart-2` | `--chart-2` | ✅ USED | ~2x | Chart series |
| `--color-chart-3` | `--chart-3` | ❌ UNUSED | 0 | Defined, no chart component uses it yet |
| `--color-chart-4` | `--chart-4` | ❌ UNUSED | 0 | Same |
| `--color-chart-5` | `--chart-5` | ❌ UNUSED | 0 | Same |
| `--color-sidebar` | `--sidebar` | ✅ USED | ~5x | App sidebar background |
| `--color-sidebar-foreground` | `--sidebar-foreground` | ✅ USED | ~8x | Sidebar text |
| `--color-sidebar-primary` | `--sidebar-primary` | ✅ USED | ~3x | Sidebar active items |
| `--color-sidebar-primary-foreground` | `--sidebar-primary-foreground` | ✅ USED | ~2x | Active item text |
| `--color-sidebar-accent` | `--sidebar-accent` | ✅ USED | ~4x | Sidebar hover states |
| `--color-sidebar-accent-foreground` | `--sidebar-accent-foreground` | ✅ USED | ~2x | Hover text |
| `--color-sidebar-border` | `--sidebar-border` | ✅ USED | ~3x | Sidebar divider |
| `--color-sidebar-ring` | `--sidebar-ring` | ❌ UNUSED | 0 | Sidebar focus ring (defined not used) |

#### SHADOW TOKENS

| Token | CSS Variable | Status | Usage Count | Notes |
|---|---|---|---|---|
| `--shadow-panel` | `--shadow-panel` | ✅ USED | ~21x | Card, Button, select, input, combobox, switch, tabs, textarea, toast, toggle |
| `--shadow-overlay` | `--shadow-overlay` | ✅ USED | ~17x | Dialog, sheet, drawer, alert-dialog, dropdown-menu, popover, tooltip, select |
| `--shadow-command` | `--shadow-command` | ✅ USED | 1x | `command.tsx` (⌘K palette) |
| `--shadow-sticky` | `--shadow-sticky` | ❌ UNUSED | 0 | Defined for sticky headers; platform header uses `border-b` + `backdrop-blur` instead |

#### DURATION TOKENS

| Token | CSS Variable | Status | Notes |
|---|---|---|---|
| `--duration-fast` | `--motion-duration-fast` | ⚠️ PARTIAL | `var(--motion-duration-fast)` used 22x as arbitrary value; utility class `duration-fast` never used |
| `--duration-normal` | `--motion-duration-normal` | ⚠️ PARTIAL | `var(--motion-duration-normal)` used 16x as arbitrary value; utility class `duration-normal` never used |
| `--duration-slow` | `--motion-duration-slow` | ❌ UNUSED | Neither as utility nor arbitrary value |

**Fix:** Replace `duration-[var(--motion-duration-fast)]` with `duration-fast` across 22 files. Same for `duration-normal` (16 files).

#### TRACKING TOKENS

| Token | Value | Status | Notes |
|---|---|---|---|
| `--tracking-heading` | `-0.025em` | ❌ UNUSED | Defined in `@theme` but never used as Tailwind utility |
| `--tracking-label` | `0.01em` | ❌ UNUSED | Defined in `@theme` but never used as Tailwind utility |
| N/A | `0.14em` | 🔴 HARDCODED 12x | `tracking-[0.14em]` used in 12+ files for uppercase labels. This should be `--tracking-uppercase: 0.14em` |

**Critical:** `tracking-label` (0.01em) is for sentence-case labels. The codebase hardcodes 0.14em for ALL-CAPS tracking. A new `--tracking-uppercase: 0.14em` token is needed.

#### FONT TOKENS

| Token | Status | Notes |
|---|---|---|
| `--font-sans` | ✅ USED | Default body font (Inter) |
| `--font-mono` | ✅ USED | Code blocks, JSON, IDs |
| `--font-numeric` | ❌ UNUSED | Defined for tabular figures; zero usage |

**Impact:** High for `font-numeric`. All MetricTile values, table cell numbers, and data displays should use `font-numeric` for tabular alignment.

#### TEXT SIZE TOKENS

| Token | Value | Status | Usage Count | Notes |
|---|---|---|---|---|
| `--text-2xs` | `0.65rem` | ✅ USED | 16x | Sidebars, metadata, dates |
| N/A | `0.6rem` | 🔴 HARDCODED 8x | `text-[0.6rem]` | Should be a new `--text-xxs: 0.6rem` |
| N/A | `10px` | 🔴 HARDCODED 4x | `text-[10px]` | Sidebar/nav: should be `--text-xxs: 0.625rem` |

#### EASING TOKENS

| Token | Status | Notes |
|---|---|---|
| `--ease-linear` | ✅ USED | 1x in platform layout |
| `--ease-in` | ❌ UNUSED | — |
| `--ease-out` | ❌ UNUSED | — |
| `--ease-in-out` | ❌ UNUSED | — |

#### Z-INDEX TOKENS

| Token | Status | Usage Count | Notes |
|---|---|---|---|
| `--z-base` | ❌ UNUSED | 0 | — |
| `--z-dropdown` | ✅ USED | 3x | dropdown-menu, navigation-menu |
| `--z-sticky` | ✅ USED | 1x | Platform header |
| `--z-overlay` | ✅ USED | 4x | alert-dialog, dialog, drawer, sheet |
| `--z-modal` | ✅ USED | 2x | alert-dialog, dialog |
| `--z-popover` | ✅ USED | 5x | navigation-menu, popover, select, tooltip |
| `--z-toast` | ❌ UNUSED | 0 | Toaster in `apps/web/app/layout.tsx` uses default |
| `--z-command` | ❌ UNUSED | 0 | Command palette `<CommandDialog>` uses default |

#### DENSITY TOKENS

| Token | Status | Usage | Notes |
|---|---|---|---|
| `--density-row-height` | ✅ USED | Table component | `h-[var(--density-row-height)]` in `th` elements |
| `--density-comfortable-control-height` | ✅ USED | Badge, Button | `h-[var(--density-comfortable-control-height)]` |
| `--density-compact-control-height` | ✅ USED | Badge, Button | Default density |
| `--density-operational-control-height` | ✅ USED | Badge | Operational variant |

**Note:** `density-row-height` is defined as `3rem` in `:root` (`globals.css` line 98) but redefined only for comfortable/compact/operational in `apps/web/app/globals.css` lines 40-42. The base `--density-row-height` is missing from the web app globals.css — only three density variants are declared. This works because `@saptm/ui/styles.css` (which includes `packages/ui/src/styles/globals.css`) defines the full set.

### 1.2 Token Coverage Summary

```
USED (25):
  color-{background,foreground,card,card-foreground,popover,popover-foreground,
         primary,primary-foreground,secondary,secondary-foreground,
         muted,muted-foreground,accent,accent-foreground,
         destructive,destructive-foreground,
         border,input,ring,
         success,success-foreground,warning,warning-foreground,risk,
         info,info-foreground,
         chart-1,chart-2,
         sidebar,sidebar-foreground,sidebar-primary,sidebar-primary-foreground,
         sidebar-accent,sidebar-accent-foreground,sidebar-border}
  shadow-panel, shadow-overlay, shadow-command
  text-2xs
  ease-linear
  z-dropdown, z-sticky, z-overlay, z-modal, z-popover
  font-sans, font-mono

UNUSED (13):
  shadow-sticky
  tracking-heading, tracking-label (as utilities)
  font-numeric
  duration-slow
  ease-in, ease-out, ease-in-out
  z-base, z-toast, z-command
  color-risk-foreground, color-chart-3, color-chart-4, color-chart-5
  color-sidebar-ring

PARTIALLY USED (2):
  duration-fast (utility class never used, only as arbitrary value)
  duration-normal (utility class never used, only as arbitrary value)
```

### 1.3 Missing Tokens (Proposed)

| Proposed Token | Value | Justification | Priority |
|---|---|---|---|
| `--tracking-uppercase` | `0.14em` | Replaces 12+ hardcoded `tracking-[0.14em]` for ALL-CAPS labels | P0 |
| `--text-xxs` | `0.6rem` | Replaces 8+ hardcoded `text-[0.6rem]` in sidebar/capacity/cargo | P1 |
| `--dropdown-min-width` | `8rem` | Replaces 4x `min-w-[8rem]` in dropdown-menu, select, combobox | P2 |
| `--chart-height-sm` | `200px` | Tokenise chart card min-heights | P2 |
| `--chart-height-md` | `300px` | Same | P2 |
| `--chart-height-lg` | `400px` | Same | P2 |
| `--z-command` | `700` | Already defined but unused; ensure CommandDialog uses `z-command` | P2 |
| `--z-toast` | `600` | Already defined but unused; ensure Toaster uses `z-toast` | P2 |

---

## 2. Component Visual Specs

### 2.1 MetricTile

**File:** `packages/ui/src/components/metric-tile.tsx`

```tsx
<Card className="p-4">                                  // rounded-xl, shadow-panel, bg-card
  <p className="text-muted-foreground text-sm">{label}</p>  // 14px
  <div className="mt-1 flex items-center justify-between gap-3">
    <p className="text-2xl font-bold">{value}</p>        // 24px / 700
    {badge && <Badge variant={variant}>{badge}</Badge>}
  </div>
  {trend && <p className={cn("mt-1 text-xs", trend.direction === "up" ? "text-success" : "text-destructive")}>
    {trend.value}
  </p>}
</Card>
```

**Visual specification table:**

| Element | Property | Token/Class | Value |
|---|---|---|---|
| Container | Padding | `p-4` / `--spacing-4` | 1rem |
| Container | Border radius | `rounded-xl` | 0.625rem |
| Container | Shadow | `shadow-panel` | `--shadow-panel` |
| Container | Background | `bg-card` | `--color-card` |
| Label | Font size | `text-sm` | 0.875rem |
| Label | Color | `text-muted-foreground` | `--color-muted-foreground` |
| Label | Font family | default | Inter / `--font-sans` |
| Value | Font size | `text-2xl` | 1.5rem |
| Value | Font weight | `font-bold` | 700 |
| Value | Font family | default (should be `font-numeric`) | Inter |
| Badge | Size | `size="compact"` (default) | `h-7 px-2 py-0.5` |
| Value-Badge gap | Margin top | `mt-1` | 0.25rem |
| Value-Badge gap | Flex gap | `gap-3` | 0.75rem |
| Trend | Font size | `text-xs` | 0.75rem |
| Trend | Margin top | `mt-1` | 0.25rem |
| Trend up | Color | `text-success` | `--color-success` |
| Trend down | Color | `text-destructive` | `--color-destructive` |

**States:**

| State | Change | Implementation |
|---|---|---|
| Default | — | As above |
| Loading | Skeleton | `SkeletonMetricTile` in `skeleton.tsx` |
| Empty value | "—" | Handled by consumer |
| With badge | Badge rendered | `{badge && <Badge>}` |
| With trend | Trend line rendered | `{trend && <p>}` |

**Variant color map:**

| Variant | Badge color | Semantic use |
|---|---|---|
| `default` | `bg-primary` | Generic metric |
| `info` | `bg-info text-info-foreground` | Informational metrics |
| `success` | `bg-success text-success-foreground` | Positive/healthy metrics |
| `warning` | `bg-warning text-warning-foreground` | Attention-requiring metrics |
| `destructive` | `bg-destructive text-destructive-foreground` | Critical/error metrics |
| `outline` | `border text-foreground` | Neutral badge |
| `secondary` | `bg-secondary text-secondary-foreground` | Secondary badge |

**ASCII diagram:**

```
┌──────────────────────────────────┐
│  p-4                             │
│  ┌──────────────────────────────┐│
│  │ text-sm text-muted-foreground││  ← label
│  │ mt-1                         ││
│  │ ┌──────────────────────────┐ ││
│  │ │ text-2xl font-bold       │ ││  ← value
│  │ │                    Badge │ ││  ← variant color
│  │ └──────────────────────────┘ ││
│  │ mt-1 text-xs                 ││
│  │ text-success/destructive     ││  ← trend (optional)
│  └──────────────────────────────┘│
└──────────────────────────────────┘
   width: 100% of grid cell
```

### 2.2 ContextRow

**File:** `packages/ui/src/components/context-row.tsx`

```tsx
<div className="flex items-center justify-between rounded-md px-3 py-2">
  <div>
    <span className="text-muted-foreground text-sm">{label}</span>
    {description && <p className="text-muted-foreground/70 mt-0.5 text-xs">{description}</p>}
  </div>
  <span className="text-sm font-medium">{value}</span>
</div>
```

**Visual specification table:**

| Element | Property | Token/Class | Value |
|---|---|---|---|
| Row | Padding X | `px-3` | 0.75rem |
| Row | Padding Y | `py-2` | 0.5rem |
| Row | Border radius | `rounded-md` | 0.375rem |
| Row | Background (muted) | `bg-muted/30` | `--color-muted` @ 30% |
| Row | Flex | `flex items-center justify-between` | — |
| Label | Font size | `text-sm` | 0.875rem |
| Label | Color | `text-muted-foreground` | `--color-muted-foreground` |
| Description | Font size | `text-xs` | 0.75rem |
| Description | Color | `text-muted-foreground/70` | 70% opacity of muted |
| Description | Margin top | `mt-0.5` | 0.125rem |
| Value | Font size | `text-sm` | 0.875rem |
| Value | Font weight | `font-medium` | 500 |
| Value | Color | default | `--color-foreground` |

**States:**

| State | Change | Implementation |
|---|---|---|
| Default | `bg-muted/30` | When `muted={true}` (default) |
| No background | No bg class | When `muted={false}` |
| With description | Extra `<p>` below label | `{description && <p>}` |

**ASCII diagram:**

```
┌──────────────────────────────────────────────┐
│  px-3 py-2 rounded-md bg-muted/30            │
│  flex items-center justify-between           │
│  ┌─ flex-1 ─────────────┐  ┌── shrink ────┐  │
│  │ text-sm muted-fg     │  │ text-sm font-md│ │
│  │ mt-0.5 text-xs /70   │  │               │  │
│  └──────────────────────┘  └───────────────┘  │
└──────────────────────────────────────────────┘
```

### 2.3 AccessState

**File:** `packages/ui/src/components/access-state.tsx`

```tsx
<Card className="flex flex-col items-center justify-center gap-4 p-8">
  {badgeLabel && <span className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
    {badgeLabel}
  </span>}
  <Icon className={cn("h-12 w-12", iconColorClasses)} />
  <div className="text-center">
    {status && <p className="text-muted-foreground/60 mb-1 text-xs">{status}</p>}
    {title && <h3 className="text-lg font-semibold">{title}</h3>}
    {(description ?? message) && <p className="text-muted-foreground mt-1 text-sm">{description ?? message}</p>}
  </div>
</Card>
```

**Visual specification table:**

| Element | Property | Token/Class | Value |
|---|---|---|---|
| Card | Padding | `p-8` | 2rem |
| Card | Layout | `flex flex-col items-center justify-center gap-4` | Centered column |
| Card | Shadow | inherited from Card | `shadow-panel` |
| Card | Background | `bg-card` | `--color-card` |
| Badge label | Font size | `text-xs` | 0.75rem |
| Badge label | Font weight | `font-medium` | 500 |
| Badge label | Text transform | `uppercase` | ALL CAPS |
| Badge label | Tracking | `tracking-wider` | 0.05em |
| Badge label | Color | `text-muted-foreground` | `--color-muted-foreground` |
| Badge label | Margin bottom | `mb-1` | 0.25rem |
| Icon | Size | `h-12 w-12` | 3rem × 3rem |
| Status | Font size | `text-xs` | 0.75rem |
| Status | Color | `text-muted-foreground/60` | 60% opacity |
| Title | Font size | `text-lg` | 1.125rem |
| Title | Font weight | `font-semibold` | 600 |
| Description | Font size | `text-sm` | 0.875rem |
| Description | Color | `text-muted-foreground` | `--color-muted-foreground` |
| Description | Margin top | `mt-1` | 0.25rem |

**Variant icon colors:**

| Variant | Icon Color | Classes |
|---|---|---|
| `blocked` | Muted 50% | `text-muted-foreground/50` |
| `error` | Destructive | `text-destructive` |
| `empty` | Muted | `text-muted-foreground` |

**States:**

| State | Props | Visual |
|---|---|---|
| Blocked (default) | `variant="blocked"`, `title`, `description` | Muted lock icon, explanatory text |
| Error | `variant="error"`, `title`, `description` | Red icon, error message |
| Empty | `variant="empty"`, `title`, `description` | Grey icon, empty message |
| Permission grant | `granted`, `label`, `permission` | Compact inline Badge with `success`/`outline` variant |
| Loading | `badgeLabel`, `title="A carregar..."`, `description` | No icon (no variant), centred text |

**ASCII diagram — Full card variant:**

```
BLOCKED                           ERROR                           EMPTY
┌──────────────────────┐          ┌──────────────────────┐       ┌──────────────────────┐
│                      │          │                      │       │                      │
│  GESTÃO DE CARGAS    │          │  GESTÃO DE CARGAS    │       │  GESTÃO DE CARGAS    │
│        🔒            │          │        ⚠️             │       │        📭             │
│                      │          │                      │       │                      │
│  Sem grant           │          │                      │       │                      │
│  Gestão de cargas    │          │  Tracking            │       │  Nenhum dado         │
│  bloqueada           │          │  operacional         │       │  encontrado          │
│                      │          │  indisponível        │       │                      │
│  A sessão está       │          │                      │       │  Não há dados de     │
│  autenticada, mas    │          │  Erro ao carregar    │       │  cargas disponíveis  │
│  falta a permissão   │          │  dados de tracking.  │       │  no momento.         │
│  ...                 │          │                      │       │                      │
└──────────────────────┘          └──────────────────────┘       └──────────────────────┘

   Icon: shield-ban            Icon: triangle-alert           Icon: (empty icon)
   color: muted/50             color: destructive             color: muted
```

**ASCII diagram — Inline permission variant:**

```
┌──────────────────────────────────────────┐
│  Permissão:    [Permitido]  cargo.read   │
│  flex items-center gap-2                │
│  span (text-sm muted) + Badge + span    │
└──────────────────────────────────────────┘
```

### 2.4 BadgeGroup

**File:** `packages/ui/src/components/badge-group.tsx`

```tsx
<div className="flex flex-wrap gap-2">
  {items.map((item) => (
    <Badge key={item.label} variant={item.variant}>
      {item.label}
    </Badge>
  ))}
</div>
```

**Visual specification table:**

| Element | Property | Token/Class | Value |
|---|---|---|---|
| Container | Display | `flex flex-wrap` | Multi-line wrap |
| Container | Gap | `gap-2` | 0.5rem |
| Badge (each) | Density | `compact` (default) | `h-7 px-2 py-0.5` |
| Badge (each) | Font | `text-xs font-medium` | 0.75rem / 500 |
| Badge (each) | Border radius | `rounded-md` | 0.375rem |

**ASCII diagram:**

```
┌──────────────────────────────────────────────┐
│  [Activo] [Gestão de Cargas]  ← flex-wrap    │
│  gap-2                                       │
│                                              │
│  Each Badge:                                 │
│  ┌────────────────────┐                      │
│  │ h-7 px-2 py-0.5   │                      │
│  │ text-xs font-medium│                      │
│  │ rounded-md border  │                      │
│  └────────────────────┘                      │
└──────────────────────────────────────────────┘
```

### 2.5 PageShell

SAPTM does NOT have a single `PageShell` component. The platform page structure is composed of:

1. **`(platform)/layout.tsx`** — Shared layout wrapper
   - `SidebarProvider` → `AppSidebar` + `SidebarInset`
   - Sticky header with `SidebarTrigger` + `BreadcrumbNav`
   - `<main>` with `px-4 py-6 md:px-6 lg:px-8`

2. **`ContentPanel`** (`packages/ui/src/components/layouts/content-panel.tsx`)
   - `max-w-7xl mx-auto flex flex-col gap-6` (narrow: `max-w-3xl`)
   - Available but **never used** in any page

3. **`PageHeader`** (`packages/ui/src/components/blocks/page/page-header.tsx`)
   - `flex flex-wrap items-start justify-between gap-4`
   - Title: `text-xl font-bold tracking-tight md:text-2xl`
   - Description: `max-w-2xl text-muted-foreground text-sm`
   - Available but only used in admin/settings pages, NOT in overview pages

4. **`DashboardHeader`** (`packages/ui/src/components/blocks/dashboard/dashboard-header.tsx`)
   - Same layout as PageHeader but with `text-2xl font-bold tracking-tight`
   - Available but **never used** anywhere

**De facto page shell pattern (every overview page):**

```
<div className="mx-auto flex max-w-7xl flex-col gap-6">
  <section className="grid gap-4 xl:grid-cols-[Xfr_Yfr]">
    <Card>...</Card>           ← KPI/metric card (left)
    <Card>...</Card>           ← Context panel (right)
  </section>
  ... page-specific content ...
</div>
```

**No PageShell component usage = consistency risk.** Every page re-implements the wrapping structure. A `PageShell` with `title`, `description`, `actions`, max-width control would centralise this.

---

## 3. Spacing & Grid System

### 3.1 Grid Base

| Property | Value | Token |
|---|---|---|
| Base unit | 8px | `--space-*` increments by 0.5rem |
| Micro adjustments | 4px | `--space-0.5` (0.125rem) |
| Page max width | 1280px | `max-w-7xl` |
| Outer padding (mobile) | 1rem | `px-4` |
| Outer padding (md) | 1.5rem | `md:px-6` |
| Outer padding (lg) | 2rem | `lg:px-8` |

### 3.2 Gap Scale

| Token | Value | Used In |
|---|---|---|
| `gap-1` | 0.25rem | Density-compact layouts |
| `gap-1.5` | 0.375rem | Button icon+text gaps |
| `gap-2` | 0.5rem | BadgeGroup, toolbar items |
| `gap-3` | 0.75rem | CardContent items, ContextRow groups, MetricTile value+badge |
| `gap-4` | 1rem | DashboardKpiGrid, SectionGrid, Card sections |
| `gap-6` | 1.5rem | Page wrapper (flex gap), SplitPanel |
| `gap-8` | 2rem | Large section separation |

### 3.3 Padding Scale

| Token | Value | Used In |
|---|---|---|
| `p-4` | 1rem | MetricTile container |
| `p-8` | 2rem | AccessState card, ErrorCard |
| `px-2` | 0.5rem | Table cells, Table head |
| `px-3` | 0.75rem | ContextRow, Badge (comfortable) |
| `px-4` | 1rem | Card horizontal, platform header |
| `px-6` | 1.5rem | Card Header/Content (via `var(--space-6)`) |
| `py-1` | 0.25rem | Badge (comfortable) |
| `py-2` | 0.5rem | ContextRow, Badge (compact) |

### 3.4 Breakpoint System

| Breakpoint | Width | Purpose |
|---|---|---|
| `sm` | 640px | Grid: 2 columns; badge groups wrap |
| `md` | 768px | Grid: 3-5 columns; header: `px-6`; inline sidebar hint visible |
| `lg` | 1024px | Split panels side-by-side; header: `px-8`; pagination extra buttons |
| `xl` | 1280px | Most split layouts activate; `max-w-7xl` = full width |
| `2xl` | 1536px | Integrations: `grid-cols-7` for form columns |

**Critical inconsistency:** Dashboard uses `lg:` breakpoint for split layout. Cargo, Tracking, Capacity, Tariffs use `xl:`. This means at 1024-1280px, Dashboard is side-by-side while other modules remain stacked.

### 3.5 Density System

| Density | Row Height | Control Height | Panel Padding |
|---|---|---|---|
| Comfortable | 3rem | 2.75rem | 1.5rem |
| Compact (default) | **2.5rem** | 2.25rem | 1rem |
| Operational | 2.25rem | 2rem | 0.75rem |

`--density-row-height` = 3rem (used in `<th>` elements). Table rows do NOT have a fixed height — they use `p-2` padding for cells.

---

## 4. Color Usage Map

### 4.1 Semantic Color Roles

| Color Token | Light (OKLCH) | Dark (OKLCH) | Primary Use | Components |
|---|---|---|---|---|
| `--background` | `0.99 0.004 255` | `0.14 0.02 255` | Page background | `body`, `main`, shells |
| `--foreground` | `0.18 0.024 255` | `0.96 0.008 255` | Primary text | All text by default |
| `--card` | `1 0 0` | `0.18 0.024 255` | Card surfaces | Card, MetricTile, AccessState |
| `--primary` | `0.33 0.086 248` | `0.72 0.13 215` | Action, emphasis | Button (default), Badge (default), links |
| `--secondary` | `0.94 0.012 255` | `0.24 0.035 255` | Subtle emphasis | Badge (secondary), Button (secondary) |
| `--muted` | `0.95 0.01 255` | `0.23 0.03 255` | Subtle background | ContextRow bg, table row hover, skeleton |
| `--muted-foreground` | `0.47 0.04 255` | `0.68 0.045 255` | Secondary text | Labels, descriptions, metadata |
| `--accent` | `0.91 0.035 215` | `0.28 0.055 215` | Interactive hover | Button ghost hover, checkbox hover |
| `--border` | `0.86 0.017 255` | `0.3 0.038 255` | Dividers | Card borders, table rows, input borders |
| `--destructive` | `0.58 0.2 25` | `0.66 0.19 25` | Error, delete | Badge destructive, error states |
| `--success` | `0.59 0.15 155` | `0.62 0.18 150` | Positive state | Badge success, positive trends |
| `--warning` | `0.77 0.16 75` | `0.8 0.15 70` | Caution | Badge warning, delays, capacity warnings |
| `--risk` | `0.62 0.18 40` | `0.68 0.2 35` | Hazard/danger | Cargo hazardous goods, critical risks |
| `--info` | `0.61 0.14 230` | `0.65 0.16 225` | Information | Badge info, analytics badges |

### 4.2 Color Usage by Component Variant

#### Badge Variants

| Variant | bg | text | border | When to use |
|---|---|---|---|---|
| `default` | `bg-primary` | `text-primary-foreground` | transparent | Generic/count badge |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | transparent | Section labels, "Resumo" |
| `success` | `bg-success` | `text-success-foreground` | transparent | "Activo", "Online", "Autorizado" |
| `warning` | `bg-warning` | `text-warning-foreground` | transparent | "Atenção", delays, capacity blocks |
| `destructive` | `bg-destructive` | `text-destructive-foreground` | transparent | "Erro", "Risco", "Bloqueado" |
| `info` | `bg-info` | `text-info-foreground` | transparent | "Analytics", "Tracking activo" |
| `outline` | transparent | `text-foreground` | `border` | Secondary labels, "Tracking", metadata |

#### Button Variants

| Variant | bg | text | border | Shadow |
|---|---|---|---|---|
| `default` | `bg-primary` | `text-primary-foreground` | none | `shadow-panel` |
| `destructive` | `bg-destructive` | `text-destructive-foreground` | none | `shadow-panel` |
| `outline` | transparent | `text-foreground` | `border-input` | `shadow-panel` |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | none | `shadow-panel` |
| `ghost` | transparent | `text-foreground` | none | none |
| `link` | transparent | `text-primary` | none | none |

#### MetricTile Variants (Badge only)

| Variant | Badge Color | Used In Modules |
|---|---|---|
| `default` | Primary | Standard counts (Total, Module count) |
| `success` | Success | "OK", "Online", active metrics |
| `warning` | Warning | Held cargo, hazardous > 0, delays |
| `destructive` | Destructive | Exceptions, critical issues |
| `info` | Info | Tracking active, info metrics |
| `outline` | Outline | Secondary labels, disabled state |
| `secondary` | Secondary | Subtle indicators |

#### AccessState Variants

| Variant | Icon Color | Border/Shadow | Used In |
|---|---|---|---|
| `blocked` | `text-muted-foreground/50` | Card default | Permission denied banners |
| `error` | `text-destructive` | Card default | Error states, API failures |
| `empty` | `text-muted-foreground` | Card default | Empty data states |

### 4.3 Context-Specific Color Usage (across pages)

| Context | Color | Pages |
|---|---|---|
| Module active badge | `success` | Dashboard, Cargo, Tracking, Capacity, Tariffs |
| Module blocked/error | `destructive` | All error.tsx pages, AccessState error variants |
| Delayed shipments | `warning` | Tracking overview, tracking detail |
| Exception shipments | `destructive` | Tracking overview, tracking analytics |
| Hazardous cargo | `risk` | Cargo overview (text-risk) |
| Inspection pending | `warning` | Cargo overview (text-warning) |
| Blocked cargo | `destructive` | Cargo overview (text-destructive) |
| Advisory severity (medium) | `warning` | Capacity advisory, tracking advisory |
| Advisory severity (high) | `destructive` | Capacity advisory, tracking advisory |
| Advisory severity (critical) | `destructive` | Capacity advisory, tracking advisory |
| Automation allowed | `success` | Capacity, tracking policy |
| Automation blocked | `warning` | Capacity, tracking policy |

---

## 5. ASCII Mockups — 8 Pages

### 5.1 Dashboard (`/app`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header [⌘K]                                    platform     │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                       │
│          │                                                               │
│          │  ┌────────── lg:grid-cols-[1.25fr_0.75fr] ────────────────┐  │
│          │  │ ┌───────────────────────────────┐ ┌──────────────────┐  │  │
│          │  │ │ [Operacional] [Tracking activo]│ │ Módulos           │  │  │
│          │  │ │ Dashboard                      │ │ operacionais      │  │  │
│          │  │ │ Vista geral das operações...   │ │                   │  │  │
│          │  │ │                                │ │ Cargas     [Abrir]│  │  │
│          │  │ │ ┌──────┐ ┌──────┐┌──────┐    │ │ Tracking   [Abrir]│  │  │
│          │  │ │ │Total │ │Track ││Plat. │    │ │ Planeamento[Abrir]│  │  │
│          │  │ │ │ 5/5  │ │Aut.  ││Online │   │ │ Admin      [Abrir]│  │  │
│          │  │ │ └──────┘ └──────┘└──────┘    │ │ ─────────────────-│  │  │
│          │  │ │  ... more MetricTiles         │ │ 12 permissões     │  │  │
│          │  │ └───────────────────────────────┘ └──────────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌──────────────────────────────────────────────────────────┐  │
│          │  │ [Dados reais] [Operational Tracking]                     │  │
│          │  │ Resumo operacional autenticado                           │  │
│          │  │ ┌──────┐┌──────┐┌──────┐┌──────┐                       │  │
│          │  │ │Cargas││Ativas││Atraso││Exc.  │   [Ver movimentos]    │  │
│          │  │ │ 42   ││ 38   ││  2   ││  0   │                       │  │
│          │  │ └──────┘└──────┘└──────┘└──────┘                       │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  Legend:  ┌─────┐ = Card (rounded-xl, border, shadow-panel)   │
│          │           ┌─────┐ = MetricTile (p-4, text-2xl font-bold)      │
│          │           [   ] = Badge                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cargo Overview (`/app/cargo`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                        │
│          │                                                               │
│          │  ┌───── xl:grid-cols-[1.2fr_0.8fr] ───────────────────────┐  │
│          │  │ ┌──────────────────────────────┐  ┌───────────────────┐ │  │
│          │  │ │ [Activo] [Gestão de Cargas]  │  │ [Resumo]          │ │  │
│          │  │ │ Cargas                       │  │ Contexto          │ │  │
│          │  │ │ Registo, liberação...        │  │ operacional       │ │  │
│          │  │ │ ┌────┐┌────┐┌────┐┌──┐┌──┐  │  │                   │ │  │
│          │  │ │ │Tot.││Em  ││Blo ││Per││In │  │  │ Taxa actividade   │ │  │
│          │  │ │ │120 ││tran││q.  ││ig ││sp │  │  │ 73%              │ │  │
│          │  │ │ │    ││ 90 ││ 5  ││ 3 ││ 2 │  │  │ Bloqueadas   (red)│ │  │
│          │  │ │ └────┘└────┘└────┘└──┘└──┘  │  │ 5 cargas         │ │  │
│          │  │ └──────────────────────────────┘  │ Inspecção   (amber)│ │  │
│          │  │                                   │ 2 pendentes        │ │  │
│          │  │                                   │ ─────────────────│ │  │
│          │  │                                   │ [Auditoria] [Rel.]│ │  │
│          │  │                                   └───────────────────┘ │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌─ LifecycleProgressIndicator ────────────────────────────┐  │
│          │  │  [🔵]→[🟢]→[🟡]→[🟠]→[🔴]→[⚪]→[⚪]                        │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[0.85fr_1.15fr] ─────────────────────────┐ │
│          │  │ ┌──────────────┐              ┌────────────────────────┐ │ │
│          │  │ │ Status Table │              │ Recent Cargo Table     │ │ │
│          │  │ │ Em trânsito 90│             │ Ref     |Orig |Dest    │ │ │
│          │  │ │ Bloqueadas  5│              │ CRG-001 | PT   | ES   │ │ │
│          │  │ │ Perigosas   3│              │ CRG-002 | PT   | FR   │ │ │
│          │  │ └──────────────┘              └────────────────────────┘ │ │
│          │  └──────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─ CargoLifecycleSections ─────────────────────────────────┐ │
│          │  │ [Registo autorizado] [Liberação indisponível] ...        │ │
│          │  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Tracking Overview (`/app/tracking`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                        │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.2fr_0.8fr] ──────────────────────────┐  │
│          │  │ ┌──────────────────────────────┐  ┌───────────────────┐ │  │
│          │  │ │ [Activo] [Tracking]          │  │ Estado            │ │  │
│          │  │ │ Tracking                     │  │ operacional       │ │  │
│          │  │ │ Acompanhamento de            │  │                   │ │  │
│          │  │ │ movimentos...                │  │ Taxa excepções    │ │  │
│          │  │ │ ┌────┐┌────┐┌────┐┌────┐    │  │ 5% (destructive)  │ │  │
│          │  │ │ │Rem.││Tr. ││Atr.││Exc.│    │  │ Atrasos      3%   │ │  │
│          │  │ │ │200 ││150 ││ 8  ││ 10 │    │  │ Remessas ativas   │ │  │
│          │  │ │ └────┘└────┘└────┘└────┘    │  │ 150/200           │ │  │
│          │  │ └──────────────────────────────┘  │ ─────────────────│ │  │
│          │  │                                   │ Actualizado em   │ │  │
│          │  │                                   │ 30/06/2026 10:00 │ │  │
│          │  │                                   └───────────────────┘ │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1fr_1fr] ───────────────────────────────┐ │
│          │  │ ┌────────────────────────────┐ ┌──────────────────────┐  │ │
│          │  │ │ [Analytics op.] [30 dias]  │ │ Distribuição por     │  │ │
│          │  │ │ Agregados de risco e SLA   │ │ modal                │  │ │
│          │  │ │ ┌────┐┌────┐┌────┐         │ │ ┌────┬────┬──────┐  │  │ │
│          │  │ │ │Atr.││Exc.││Even│...      │ │ │Modal│Total│Ativ.│  │  │ │
│          │  │ │ │4%  ││5%  ││1.2K│         │ │ │Ferro│ 80  │ 60  │  │  │ │
│          │  │ │ └────┘└────┘└────┘         │ │ └────┴────┴──────┘  │  │ │
│          │  │ └────────────────────────────┘ └──────────────────────┘  │ │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.15fr_0.85fr] ─────────────────────────┐ │
│          │  │ ┌──────────────────────────────────┐ ┌──────────────┐    │ │
│          │  │ │ [IA advisory] [Sem auto.]        │ │ Política de  │    │ │
│          │  │ │ Recomendações operacionais       │ │ automação    │    │ │
│          │  │ │ ┌─ Recomendação ────────────────┐│ │ Automação:   │    │ │
│          │  │ │ │ [high] [risco] 85% confiança  ││ │ Bloqueada    │    │ │
│          │  │ │ │ Alto risco de atraso...       ││ │ Aprov. hum.: │    │ │
│          │  │ │ │ Acção recomendada...          ││ │ Obrigatória  │    │ │
│          │  │ │ └───────────────────────────────┘│ └──────────────┘    │ │
│          │  │ └──────────────────────────────────┘                     │ │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.1fr_0.9fr] ──────────────────────────┐  │
│          │  │ ┌─────────────────┐  ┌────────────────────────────────┐ │  │
│          │  │ │ Event Record    │  │ [Eventos] [Registo autorizado] │ │  │
│          │  │ │ Form            │  │ Registo de eventos             │ │  │
│          │  │ └─────────────────┘  │ Total remessas: 200          │ │  │
│          │  │                      │ Activas: 150                  │ │  │
│          │  │                      └────────────────────────────────┘ │  │
│          │  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Planning Overview (`/app/planning`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                        │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.2fr_0.8fr] ──────────────────────────┐  │
│          │  │ ┌─────────────────────────────────────┐  ┌────────────┐  │  │
│          │  │ │ [Activo] [Planeamento]              │  │ [Resumo]   │  │  │
│          │  │ │ Planeamento                         │  │ Estado das │  │  │
│          │  │ │ Confirmação, dispatch e             │  │ ordens     │  │  │
│          │  │ │ replaneamento de ordens             │  │            │  │  │
│          │  │ │ ┌────┐┌────┐┌────┐┌───┐┌──┐┌──┐┌──┐│  │ Tx conf.:  │  │  │
│          │  │ │ │Ord ││Conf││Canc││Fut││Cap││Tra││Des│  │ 85%        │  │  │
│          │  │ │ │120 ││ 90 ││ 5  ││30 ││80 ││70 ││60│  │ Tx disp.:  │  │  │
│          │  │ │ └────┘└────┘└────┘└───┘└──┘└──┘└──┘  │ 67%         │  │  │
│          │  │ └─────────────────────────────────────┘  │ Canceladas: │  │  │
│          │  │                                          │ 5 (red if>0)│  │  │
│          │  │                                          │ Partidas:30 │  │  │
│          │  │                                          └────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.1fr_0.9fr] ──────────────────────────┐  │
│          │  │ ┌────────────────────────────────┐  ┌──────────────────┐│  │
│          │  │ │ Ordens recentes                │  │ Regras de        ││  │
│          │  │ │ ┌────┬────┬────┬────┬────────┐│  │ negócio          ││  │
│          │  │ │ │Ordem│Carga│Rota│Jan.│Status ││  │ Confirmação: ... ││  │
│          │  │ │ │REF  │CRG  │PT→ │01/ │Confirm││  │ Dispatch: ...    ││  │
│          │  │ │ │     │     │ES  │07  │       ││  │ Replaneamento:..││  │
│          │  │ │ └────┴────┴────┴────┴────────┘│  │ Cancelamento: ..││  │
│          │  │ └────────────────────────────────┘  │ ────────────── ││  │
│          │  │                                     │ Capacidade: .. ││  │
│          │  │                                     │ Tracking: ..   ││  │
│          │  │                                     └──────────────────┘│  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌─ Forms (stacked, xl:grid-cols-2) ───────────────────────┐  │
│          │  │ [Confirmar Ordem]   [Reagendar] [Dispatch] [Cancelar]   │  │
│          │  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Tracking Detail (`/app/tracking/[shipmentId]`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                        │
│          │                                                               │
│          │  [Voltar ao tracking]                                         │
│          │                                                               │
│          │  ┌── xl:grid-cols-[0.7fr_1.3fr] ──────────────────────────┐  │
│          │  │ ┌────────────────────────┐  ┌──────────────────────────┐│  │
│          │  │ │ Próxima acção          │  │ [Em trânsito] [Ferrovia]  ││  │
│          │  │ │ ███████████████████████│  │ [REF-001]                 ││  │
│          │  │ │ Monitorizar trajeto    │  │                           ││  │
│          │  │ │ Carga em trânsito...   │  │ Carga de aço              ││  │
│          │  │ │ [Monitorizar]          │  │ Eventos da remessa...     ││  │
│          │  │ │ [Recarregar] [Auditor]  │  │ ┌────┐┌────┐┌────┐┌────┐││  │
│          │  │ └────────────────────────┘  │ │Pri ││Ev. ││Ult.││Loc.│││  │
│          │  │ ┌────────────────────────┐  │ │ 2  ││12  ││Esc.││PT  │││  │
│          │  │ │ Rota operacional        │  │ └────┘└────┘└────┘└────┘││  │
│          │  │ │ Origem         Porto X  │  └──────────────────────────┘│  │
│          │  │ │ Destino       Lisboa    │                             │  │
│          │  │ │ Partida planeada 01/07  │  ┌──────────────────────────┐│  │
│          │  │ │ ETA              03/07  │  │ Timeline de eventos     ││  │
│          │  │ │ Chegada real        —   │  │ ● Partida          10:30││  │
│          │  │ └────────────────────────┘  │ ○ Escala de Porto  14:00││  │
│          │  │ ┌────────────────────────┐  │ ● Chegada Lisboa   18:00││  │
│          │  │ │ Exceções               │  └──────────────────────────┘│  │
│          │  │ │ [Pode gerir] [Somente  │                             │  │
│          │  │ │  leitura]              │  ┌──────────────────────────┐│  │
│          │  │ │ Status: atrasado       │  │ Informação da remessa   ││  │
│          │  │ │ Resolução: Sim         │  │ Referência     REF-001  ││  │
│          │  │ └────────────────────────┘  │ Ref. externa       —    ││  │
│          │  └─────────────────────────────┘│ Última actual.  10:30  ││  │
│          │                                 │ ─────────────────────  ││  │
│          │  ┌── xl:grid-cols-2 ───────────┐│ [Auditoria] [Reports]  ││  │
│          │  │ [Gestão Excepção] [Resolução]│└──────────────────────────┘│  │
│          │  └──────────────────────────────┘                             │
│          │                                                               │
│          │  ┌─ Cross-link Banner (when open exceptions exist) ────────┐  │
│          │  │ [Vinculo operacional] [Tracking · Carga]                 │  │
│          │  │ Exceção operacional vinculada à carga                    │  │
│          │  │ [Módulo Cargo] [Compliance aduaneiro] [Auditoria]        │  │
│          │  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Capacity Overview (`/app/capacity`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                        │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.2fr_0.8fr] ──────────────────────────┐  │
│          │  │ ┌──────────────────────────────────┐  ┌────────────────┐ │  │
│          │  │ │ [Capacidade] [Slots e reservas]  │  │ Reservas e     │ │  │
│          │  │ │ Capacidade operacional            │  │ slots          │ │  │
│          │  │ │ Recursos, janelas e reservas...   │  │                │ │  │
│          │  │ │ ┌────┐┌────┐┌────┐┌────┐┌────┐   │  │ Total res.:200 │ │  │
│          │  │ │ │Rec.││Abe.││Blo.││Fec.││Res.│   │  │ Slots ab.: 50  │ │  │
│          │  │ │ │500 ││ 40 ││ 5  ││ 10 ││ 180│   │  │ Slots bl.:  5  │ │  │
│          │  │ │ └────┘└────┘└────┘└────┘└────┘   │  │ [Auditoria]    │ │  │
│          │  │ └──────────────────────────────────┘  │ [Reports]       │ │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.05fr_0.95fr] ─────────────────────────┐ │
│          │  │ ┌────────────────────────────────┐  ┌──────────────────┐│ │
│          │  │ │ Slots operacionais             │  │ Reservas         ││ │
│          │  │ │ ┌────┬────┬────┬────┬────────┐│  │ recentes         ││ │
│          │  │ │ │Slot│Rec.│Jan.│Unid│Status  ││  │ ┌────┬────┬────┐││ │
│          │  │ │ │REF │R01 │01/ │10/ │[Aberto]││  │ │Res.│Carg│Est.│││ │
│          │  │ │ └────┴────┴────┴────┴────────┘│  │ └────┴────┴────┘││ │
│          │  │ └────────────────────────────────┘  └──────────────────┘│ │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.15fr_0.85fr] ─────────────────────────┐ │
│          │  │ ┌────────────────────────────────────┐  ┌──────────────┐│ │
│          │  │ │ [Advisory de capacidade] [Sem      │  │ Política de  ││ │
│          │  │ │  automação]                         │  │ otimização   ││ │
│          │  │ │ Otimização assistida                │  │ Automação:   ││ │
│          │  │ │ ┌─ Recomendação ──────────────────┐ │  │ Bloqueada   ││ │
│          │  │ │ │ [high] [saturação] 90% conf.    │ │  │ Aprov. hum.: ││ │
│          │  │ │ │ Saturação no terminal X...      │ │  │ Obrigatória ││ │
│          │  │ │ └─────────────────────────────────┘ │  └──────────────┘│ │
│          │  │ └────────────────────────────────────┘                   │ │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[0.95fr_1.05fr] ─────────────────────────┐ │
│          │  │ ┌────────────────────────────┐  ┌──────────────────────┐│ │
│          │  │ │ [Analytics] [Dec. advisory]│  │ Janela de análise    ││ │
│          │  │ │ Analytics de decisões      │  │ Janela: 30 dias      ││ │
│          │  │ │ ┌─────┐┌─────┐┌────┐┌───┐ │  │ Com aprovação:  15  ││ │
│          │  │ │ │Dec. ││Apro.││Rej.││Tx.│ │  └──────────────────────┘│ │
│          │  │ │ │120  ││ 80  ││ 40 ││67%│ │                          │ │
│          │  │ │ └─────┘└─────┘└────┘└───┘ │                          │ │
│          │  │ └────────────────────────────┘                          │ │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-2 ───────────────────────────────────────┐  │
│          │  │ ┌────────────────────┐  ┌─────────────────────────────┐  │  │
│          │  │ │ Decisões por tipo  │  │ Decisões recentes             │  │  │
│          │  │ │ ┌────┬────┬────┬──┐│  │ ┌────┬───────┬──────────┐   │  │  │
│          │  │ │ │Tipo│Dec.│Apro│Tx││  │ │Rec.│Estado │ Decisor   │   │  │  │
│          │  │ │ └────┴────┴────┴──┘│  │ └────┴───────┴──────────┘   │  │  │
│          │  │ └────────────────────┘  └─────────────────────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-2 ───────────────────────────────────────┐  │
│          │  │ [Registar Recurso]  [Abrir Slot]                          │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.15fr_0.85fr] ─────────────────────────┐  │
│          │  │ [Pre-Check] [Reservar Slot]              [Cancelar Res.]  │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌──────────────────────────────────────────────────────────┐  │
│          │  │ Regras aplicadas (ContextRow grid)                        │  │
│          │  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Tariffs Overview (`/app/tariffs`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  flex flex-col gap-6 (note: no max-w-7xl wrapper!)             │
│          │                                                               │
│          │  ┌──────────────────────────────────────────────────────────┐  │
│          │  │ [Tarifário] [Pricing operacional]                        │  │
│          │  │ Pricing operacional                                      │  │
│          │  │ Rate cards, regras tarifárias, cotações...               │  │
│          │  │ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐               │  │
│          │  │ │Rate  ││Ativos││Regras││Calc. ││Apro. │               │  │
│          │  │ │cards ││ 15   ││ 120  ││ 45   ││ 30   │               │  │
│          │  │ │ 20   │└──────┘└──────┘└──────┘└──────┘               │  │
│          │  │ └──────┘                                                │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.1fr_0.9fr] ──────────────────────────┐  │
│          │  │ ┌──────────────────────────────┐  ┌────────────────────┐│  │
│          │  │ │ Rate cards ativos            │  │ Cotações recentes  ││  │
│          │  │ │ ┌────┬────┬──────┬─────────┐ │  │ ┌────┬────┬────┐ ││  │
│          │  │ │ │RC  │Moe.│Valid.│Estado   │ │  │ │Cot.│Carg│Tot.│ ││  │
│          │  │ │ │RC01│EUR │01/07 │[Ativo]  │ │  │ └────┴────┴────┘ ││  │
│          │  │ │ └────┴────┴──────┴─────────┘ │  └────────────────────┘│  │
│          │  │ └──────────────────────────────┘                         │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-2 ───────────────────────────────────────┐  │
│          │  │ [Registar Rate Card]   [Adicionar Regra Tarifária]        │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-2 ───────────────────────────────────────┐  │
│          │  │ [Calcular Cotação]    [Aprovar Cotação]                    │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌──────────────────────────────────────────────────────────┐  │
│          │  │ Regras aplicadas (ContextRow grid)                        │  │
│          │  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.8 Integrations (`/app/integrations`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  sidebar │  header                                                       │
│          ├───────────────────────────────────────────────────────────────┤
│          │  mx-auto max-w-7xl flex flex-col gap-6                        │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1.2fr_0.8fr] ──────────────────────────┐  │
│          │  │ ┌──────────────────────────────────┐  ┌────────────────┐ │  │
│          │  │ │ [Integration Gateway] [Service   │  │ Modelo de      │ │  │
│          │  │ │  Accounts] [env]                  │  │ segurança      │ │  │
│          │  │ │ Integration Gateway               │  │                │ │  │
│          │  │ │ Service accounts e integrações    │  │ Autorização:   │ │  │
│          │  │ │ EDI, ERP, TOS...                  │  │ RBAC           │ │  │
│          │  │ │ ┌────┐┌────┐┌────┐┌────┐┌────┐   │  │ Idempotência:  │ │  │
│          │  │ │ │Svc ││At. ││Keys││Ev. ││Proc.│   │  │ Chave única    │ │  │
│          │  │ │ │ 5  ││ 4  ││ 12 ││1.5K││1.2K│   │  │ Secrets:       │ │  │
│          │  │ │ └────┘└────┘└────┘└────┘└────┘   │  │ env            │ │  │
│          │  │ └──────────────────────────────────┘  └────────────────┘ │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-2 2xl:grid-cols-7 ───────────────────────┐  │
│          │  │ [Criar Service Account] [Registar Evento] [Port TOS]     │  │
│          │  │ [Rail TMS] [Carrier TMS] [Telematics] [Customs ERP]      │  │
│          │  │ [Warehouse WMS]                                          │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌── xl:grid-cols-[1fr_1fr] ──────────────────────────────┐  │
│          │  │ ┌────────────────────────────────┐  ┌──────────────────┐│  │
│          │  │ │ Service Accounts               │  │ Eventos externos ││  │
│          │  │ │ ┌────┬────┬──────┬───────┐     │  │ recentes          ││  │
│          │  │ │ │Conta│Est.│Escop.│Keys   │     │ │ ┌────┬────┬────┐│  │
│          │  │ │ │API  │At. │rw,ro │sk-... │     │ │ │Ev. │Orig│Rec.││  │
│          │  │ │ └────┴────┴──────┴───────┘     │ │ └────┴────┴────┘│  │
│          │  │ └────────────────────────────────┘  └──────────────────┘│  │
│          │  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Component-Per-Page Specification Tables

### 6.1 Dashboard (`/app`)

| Section | Component(s) | Props | Variants Used |
|---|---|---|---|
| Hero card | `Card`, `Badge` (×2), `CardTitle`, `CardDescription` | Badge: `"Operacional"` success, `"Tracking activo"` info | success, info |
| KPI row | `MetricTile` (×4) | `label`, `value`, `badge`, `variant` | success, warning |
| Module list | `Card`, `CardTitle`, `Button`, `Badge`, `Separator` | Button: `size="sm" variant="outline"` | outline |
| Snapshot | `Card`, `Badge`, `CardTitle`, `StatusTile` (local), `Button` | Badge: `"Dados reais"` success | success, warning, destructive, info |

### 6.2 Cargo Overview (`/app/cargo`)

| Section | Component(s) | Props | Variants Used |
|---|---|---|---|
| Header left | `Card`, `BadgeGroup`, `CardTitle`, `CardDescription`, `MetricTile` (×5) | Badge: success + outline; Tiles: default, warning | success, outline, default, warning |
| Context panel | `Card`, `Badge`, `CardTitle`, `CardDescription`, `Button` | Badge: `"Resumo"` secondary; Buttons: `size="sm" variant="outline"` | secondary, outline |
| Lifecycle | `LifecycleProgressIndicator` | — | — |
| Status tables | `CargoStatusTable`, `CargoRecentTable` | Table, Badge variants per row | success, warning, outline |
| Lifecycle sections | `CargoLifecycleSections` | Permission booleans as props | — |

### 6.3 Tracking Overview (`/app/tracking`)

| Section | Component(s) | Props | Variants Used |
|---|---|---|---|
| Header left | `Card`, `BadgeGroup`, `CardTitle`, `CardDescription`, `MetricTile` (×4) | Badge: success + outline | success, outline, default, warning, destructive |
| Context panel | `Card`, `CardTitle`, `CardDescription` | No module badge | — |
| Analytics | `Card`, `BadgeGroup`, `CardTitle`, `MetricTile` (×6), `Table` | Badge: info + outline | info, outline, warning, destructive |
| Advisory | `Card`, `BadgeGroup`, `Card`, `Badge` (×3 per recommendation) | Badge: warning + outline + secondary | warning, outline, secondary |
| Policy card | `Card`, `CardTitle`, raw `flex justify-between` | — | — |
| Forms | `TrackingEventRecordForm`, `TrackingStatusTables` | — | — |
| Sidebar | `Card`, `BadgeGroup`, `CardTitle`, raw `flex justify-between` | Badge: secondary + success/warning | secondary, success, warning |

### 6.4 Planning Overview (`/app/planning`)

| Section | Component(s) | Props | Variants Used |
|---|---|---|---|
| Header left | `Card`, `BadgeGroup`, `CardTitle`, `CardDescription`, `MetricTile` (×7 × `md:grid-cols-3 xl:grid-cols-7`) | Badge: success + outline | success, outline |
| Context panel | `Card`, `Badge`, `CardTitle`, `CardDescription`, raw `flex justify-between` | Badge: `"Resumo"` secondary | secondary |
| Orders table | `Card`, `CardTitle`, `Table`, `Badge` (per row) | Badge: success/warning per status | success, warning, outline |
| Business rules | `Card`, `CardTitle`, `CardDescription`, raw `flex justify-between`, `Separator` | — | — |
| Forms | `TransportOrderConfirmForm`, `TransportOrderRescheduleForm`, `TransportOrderDispatchForm`, `TransportOrderCancelForm` | Permission booleans | — |

### 6.5 Tracking Detail (`/app/tracking/[shipmentId]`)

| Section | Component(s) | Variants Used |
|---|---|---|
| Back button | `Button asChild variant="outline"` | outline |
| Next action | `TrackingNextActionCard` | — |
| Shipment header | `Card`, `Badge` (×3), `CardTitle`, `CardDescription`, `MetricTile` (×4) | status variant, secondary, outline |
| Route | `Card`, `ContextRow` (×5) | — |
| Exceptions | `Card`, `Badge` (×3), `CardTitle`, `ContextRow` (×4) | warning, outline, success |
| Timeline | `Card`, `Timeline`, `TimelineItem`, `Badge` | outline |
| Shipment info | `Card`, `ContextRow` (×3), `Separator` | — |
| Cross-link | `Card`, `Badge` (×2), custom `<Link>` | destructive, outline |
| Forms | `TrackingExceptionManageForm`, `TrackingExceptionResolveForm` | — |

### 6.6 Capacity Overview (`/app/capacity`)

| Section | Component(s) | Variants Used |
|---|---|---|
| Header left | `Card`, `BadgeGroup`, `CardTitle` (`text-3xl`), `CardDescription` (`text-base`), `MetricTile` (×5) | success, outline |
| Context panel | `Card`, `CardTitle`, `ContextRow` (×3), custom `<Link>` | — |
| Slots table | `Card`, `Table`, `Badge` | success, warning, `resolveSlotStatusVariant()` |
| Reservations | `Card`, `Table`, `Badge` | success, outline |
| Advisory | `Card`, `BadgeGroup`, `Card`, `Badge` (×4 per rec), `ContextRow` | warning, outline, secondary, `resolveAdvisorySeverityVariant()` |
| Policy | `Card`, `ContextRow` (×3) | — |
| Decision analytics | `Card`, `BadgeGroup`, `MetricTile` (×4) | info, outline |
| Windows | `Card`, `ContextRow` | — |
| Decision tables | `Card`, `Table`, `Badge` | success, warning, outline |
| Forms | `CapacityResourceRegisterForm`, `CapacitySlotOpenForm`, `CapacityAdvisoryDecisionForm`, `CapacityPreCheck`, `CapacitySlotReserveForm`, `CapacitySlotCancelForm` | — |
| Rules | `Card`, `ContextRow` (×5) | — |

### 6.7 Tariffs Overview (`/app/tariffs`)

| Section | Component(s) | Variants Used |
|---|---|---|
| Header full | `Card`, `BadgeGroup`, `CardTitle` (`text-3xl`), `CardDescription` (`text-base`), `MetricTile` (×5) | success, outline |
| Rate cards | `Card`, `Table`, `Badge` | success, outline |
| Quotes | `Card`, `Table`, `Badge` | success, outline |
| Forms | `TariffRateCardRegisterForm`, `TariffRateRuleAddForm`, `TariffQuoteCalculateForm`, `TariffQuoteApproveForm` | — |
| Rules | `Card`, `ContextRow` (×4) | — |

### 6.8 Integrations (`/app/integrations`)

| Section | Component(s) | Variants Used |
|---|---|---|
| Header left | `Card`, `Badge` (×3), `CardTitle` (`text-3xl`), `CardDescription` (`text-base`), `MetricTile` (×5) | success, outline |
| Security model | `Card`, `CardTitle`, `ContextRow` (×4) | — |
| Forms grid | All 8 integration forms in `xl:grid-cols-2 2xl:grid-cols-7` | — |
| Service accounts | `Card`, `Table`, `Badge` (per row) | success, warning, outline |
| Recent events | `Card`, `Table`, `Badge` | warning, success |

---

## 7. Design System Inconsistency Report

### 7.1 Layout Container Inconsistencies

| Page | Wrapper | Max Width | Pattern | Same? |
|---|---|---|---|---|
| Dashboard | `<div className="mx-auto flex max-w-7xl flex-col gap-6">` | 1280px | Direct | — |
| Cargo | Same via `CargoOverviewClient` | 1280px | Client wrapper | ✅ |
| Tracking | Same via `TrackingOverviewClient` | 1280px | Client wrapper | ✅ |
| Tracking Detail | Same direct | 1280px | Direct | ✅ |
| Planning | Same direct | 1280px | Direct | ✅ |
| Capacity | Same direct | 1280px | Direct | ✅ |
| **Tariffs** | **`<main className="flex flex-col gap-6">`** | **100% (full width)** | **Missing `max-w-7xl mx-auto`** | **❌** |
| Integrations | Same as Dashboard | 1280px | Direct | ✅ |

**🔴 Issue:** Tariffs page uses `<main className="flex flex-col gap-6">` — no `max-w-7xl mx-auto`. Content stretches full width.

### 7.2 Title/Heading Inconsistencies

| Page | CardTitle size | Style | Page title |
|---|---|---|---|
| Dashboard | `text-2xl` | `font-bold` | "Dashboard" |
| Cargo | `text-2xl` | `font-bold` | "Cargas" |
| Tracking | `text-2xl` | `font-bold` | "Tracking" |
| Planning | `text-2xl` | `font-bold` | "Planeamento" |
| Tracking Detail | `text-3xl` | `font-bold` | Cargo description (dynamic) |
| Capacity | **`text-3xl`** | `font-bold` | "Capacidade operacional" |
| Tariffs | **`text-3xl`** | `font-bold` | "Pricing operacional" |
| Integrations | **`text-3xl`** | `font-bold` | "Integration Gateway" |

**⚠️ Issue:** Dashboard, Cargo, Tracking, Planning use `text-2xl` (1.5rem). Capacity, Tariffs, Integrations, Tracking Detail use `text-3xl` (1.875rem). No rationale for the size variance.

### 7.3 Description Inconsistencies

| Page | Description class | Max width |
|---|---|---|
| Dashboard | `max-w-3xl leading-6` | 48rem |
| Cargo | `max-w-3xl leading-6` | 48rem |
| Tracking | `max-w-3xl leading-6` | 48rem |
| Planning | `max-w-3xl leading-6` | 48rem |
| Tracking Detail | `max-w-3xl text-base leading-7` | 48rem + larger base |
| Capacity | **`max-w-3xl text-base leading-7`** | Larger font |
| Tariffs | **`max-w-3xl text-base leading-7`** | Larger font |
| Integrations | **`max-w-3xl text-base leading-7`** | Larger font |

**⚠️ Issue:** Dashboard/Cargo/Tracking/Planning descriptions use `text-sm` (0.875rem). Capacity/Tariffs/Integrations/TrackingDetail use `text-base` (1rem) with `leading-7`. No justification for the difference.

### 7.4 ContextRow vs Raw `flex justify-between`

Three different patterns exist for label/value rows:

**Pattern A: ContextRow component**
- `tracking/[shipmentId]/page.tsx` — route info, exception info, shipment info
- `capacity/page.tsx` — policy card, window analytics, rules card
- `tariffs/page.tsx` — rules card
- `integrations/page.tsx` — security model
- **✅ Preferred approach**

**Pattern B: Raw `flex justify-between` with raw divs**
- `cargo-overview-header.tsx` — context panel (4 rows)
- `tracking-overview-header.tsx` — context panel (4 rows)
- `tracking-analytics-section.tsx` — policy card (3 rows)
- `planning/page.tsx` — context panel (4 rows)
- `TrackingOverviewClient.tsx` — event info card (3 rows)
- Dashboard `page.tsx` — module list (4 rows)
- `operations-snapshot.tsx` — error state context

**Pattern C: Raw `flex justify-between` inside CardContent gap-3 text-sm**
- Same as Pattern B but wrapped in CardContent
- Used in Cargo, Tracking, Planning overview context panels

**🔴 Issue:** 7+ files use raw `flex justify-between` instead of `ContextRow`. The visual difference:
- `ContextRow`: rounded-md, opaque background (`bg-muted/30`), hover effect
- Raw: no background, no hover, clean look

Both patterns have different visual weights. **Decision needed:** Are context panel rows supposed to have backgrounds or not?

### 7.5 BadgeGroup Usage

| Page | BadgeGroup in header? | Badge in context panel? |
|---|---|---|
| Dashboard | ✅ `Badge` (raw, not BadgeGroup) | — |
| Cargo | ✅ `BadgeGroup` `["Activo", "Gestão de Cargas"]` | ✅ `Badge variant="secondary"` "Resumo" |
| Tracking | ✅ `BadgeGroup` `["Activo", "Tracking"]` | **❌ None** |
| Planning | ✅ `BadgeGroup` `["Activo", "Planeamento"]` | ✅ `Badge variant="secondary"` "Resumo" |
| Capacity | ✅ `BadgeGroup` `["Capacidade", "Slots e reservas"]` | — |
| Tariffs | ✅ `BadgeGroup` `["Tarifário", "Pricing operacional"]` | — |
| Integrations | **❌ Raw div with 3 Badges** (not BadgeGroup) | — |

**⚠️ Issue:** Dashboard uses raw `<Badge>` pairs (not BadgeGroup). Integrations uses raw `<div className="flex flex-wrap">` with 3 `<Badge>` components. 5 of 8 pages use BadgeGroup correctly.

### 7.6 Page Description Pattern

Some pages embed the description inside `CardDescription` under the header card, others put it in a separate card:

- **Embedded in header card:** Cargo, Tracking, Planning, Capacity, Tariffs, Integrations
- **Separate Card:** Dashboard splits header + module list into two cards
- **CardDescription max-width:**
  - Dashboard, Cargo, Tracking, Planning: `max-w-3xl` (default leading)
  - Capacity, Tariffs, Integrations, Tracking Detail: `max-w-3xl text-base leading-7`

### 7.7 KPI Grid Column Counts

| Page | Grid Columns | MetricTile Count |
|---|---|---|
| Dashboard | `md:grid-cols-4` | 4 |
| Cargo | `md:grid-cols-5` | 5 |
| Tracking | `md:grid-cols-4` | 4 |
| Planning | `md:grid-cols-3 xl:grid-cols-7` | 7 |
| Tracking Detail | `md:grid-cols-4` | 4 |
| Capacity | `md:grid-cols-5` | 5 |
| Tariffs | `md:grid-cols-5` | 5 |
| Integrations | `md:grid-cols-5` | 5 |

Planning is the outlier with `xl:grid-cols-7` for 7 MetricTiles — this is valid but compresses severely. Consider 2 rows at `xl` and below.

### 7.8 Breakpoint Activation

| Page | Split Layout Breakpoint |
|---|---|
| Dashboard | `lg:grid-cols-[1.25fr_0.75fr]` |
| Cargo | `xl:grid-cols-[1.2fr_0.8fr]` |
| Tracking | `xl:grid-cols-[1.2fr_0.8fr]` |
| Planning | `xl:grid-cols-[1.2fr_0.8fr]` |
| Tracking Detail | `xl:grid-cols-[0.7fr_1.3fr]` |
| Capacity | `xl:grid-cols-[various]` |
| Tariffs | `xl:grid-cols-[1.1fr_0.9fr]` |
| Integrations | `xl:grid-cols-[1.2fr_0.8fr]` |

**🔴 Inconsistency:** Dashboard uses `lg:` while all other pages use `xl:`. At 1024-1280px width, Dashboard is side-by-side while all other modules remain stacked vertically.

### 7.9 Missing CardTitle in Overview Headers

- Cargo overview header: ✅ Has `CardTitle` "Cargas"
- Tracking overview header: ✅ Has `CardTitle` "Tracking"
- Dashboard: ✅ Has `CardTitle` "Dashboard"
- Planning: ✅ Has `CardTitle` "Planeamento"
- Capacity: ✅ Has `CardTitle` "Capacidade operacional"
- Tariffs: ✅ Has `CardTitle` "Pricing operacional"
- Integrations: ✅ Has `CardTitle` "Integration Gateway"

✅ Consistent.

### 7.10 MetricTile Variant Usage Across Pages

| Variant | Dashboard | Cargo | Tracking | Planning | Capacity | Tariffs | Integrations |
|---|---|---|---|---|---|---|---|
| `default` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `success` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `warning` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `destructive` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `info` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `outline` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `secondary` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 7.11 `global-error.tsx` — Design System Complete Bypass

**File:** `apps/web/app/global-error.tsx`

Uses 17+ inline style rules instead of Tailwind/shadcn/ui:
- `backgroundColor: "var(--background)"` instead of `bg-background`
- `fontFamily: 'system-ui, ...'` instead of default font
- `border: "1px solid var(--border)"` instead of `border`
- `borderRadius: "0.75rem"` instead of `rounded-xl`
- Inline `<button>` instead of `<Button>` component
- `<a>` instead of `<Link>` from next/link

This file cannot import any components (server error boundary context) but CAN use Tailwind utility classes. The `style={{ }}` approach is unnecessary.

### 7.12 Duplicate Local Component: StatusTile

`operations-snapshot.tsx` lines 22-42 define a local `StatusTile` component that duplicates `MetricTile`:

| Aspect | MetricTile (canonical) | StatusTile (local) |
|---|---|---|
| Shadow | `shadow-panel` | `shadow-none` |
| Label size | `text-sm` (0.875rem) | `text-xs` (0.75rem) |
| Label style | sentence case | `uppercase` |
| Label tracking | normal | `tracking-[0.14em]` |
| Value weight | `font-bold` (700) | `font-semibold` (600) |
| Value/Badge gap | `mt-1` (0.25rem) | `mt-3` (0.75rem) |
| Truncate | — | `truncate` |
| Width | based on parent | `shadow-none` on a Card (inner card) |

### 7.13 `operations-snapshot.tsx` — RBAC Badge

Line 50: `<Badge variant="warning">RBAC</Badge>` — uses permission-level jargon "RBAC" in the UI, violating the PT-PT operational language convention. Should be "Bloqueado" or "Sem permissão".

### 7.14 Dashboard Page — Permission Names Exposed

Lines 78-118 show permission names in the UI:
- `cargo.read`, `tracking.shipment.read`, `planning.order.read`, `admin.identity.read`

These are internal permission strings, not operational PT-PT labels. Violates the "Proibido expor permission names" rule.

### 7.15 Missing `ContentPanel` Adoption

`ContentPanel` exists at `packages/ui/src/components/layouts/content-panel.tsx` but is used **zero times**. Every page re-implements `mx-auto max-w-7xl flex flex-col gap-6` (except Tariffs, which doesn't even have `max-w-7xl`).

### 7.16 Hardcoded Values Inventory

| Value | Occurrences | Files | Status |
|---|---|---|---|
| `tracking-[0.14em]` | 12+ | `operations-snapshot.tsx`, `json-block.tsx`, `operational-journey-panel.tsx` (×3), `command-evidence-panel.tsx` (×3), `capacity-pre-check.tsx` (×3), `cargo-lifecycle-group.tsx` | 🔴 Missing token `--tracking-uppercase` |
| `text-[0.6rem]` | 8+ | `organization-switcher.tsx`, `command-evidence-panel.tsx`, `capacity-pre-check.tsx` (×4), `cargo-lifecycle-group.tsx` | 🔴 Should use `text-xxs` |
| `text-[10px]` | 4+ | `sidebar.tsx` (×2), `nav-user.tsx`, `team-switcher.tsx` | 🔴 Should use `text-xxs` |
| `text-[0.5rem]` | 3+ | `operational-journey-panel.tsx`, `capacity-pre-check.tsx` (×2) | ⚠️ Extreme small; review necessity |
| `text-[0.55rem]` | 1 | `capacity-pre-check.tsx` | ⚠️ Fragment size |
| `text-[0.68rem]` | 1 | `design-system/page.tsx` | 🔴 Meta-violation (DS page itself) |
| `text-[0.7rem]` | 1 | `settings-shell.tsx` | ⚠️ Should use 11px (0.6875rem) |
| `min-w-[8rem]` | 4 | `dropdown-menu.tsx` (×2), `select.tsx`, `combobox.tsx` | ⚠️ Consistent but not tokenised |
| `max-w-[calc(100%-2rem)]` | 2 | `alert-dialog.tsx`, `dialog.tsx` | ⚠️ Responsive constraint |
| `min-h-[200/300/400px]` | 3 | `dashboard-chart-card.tsx` | ⚠️ Should be tokenised |
| `style={{ minHeight }}` | 1 | `charts/chart-card.tsx` | ⚠️ Inline style for height prop |
| `tracking-[0.12em]` | 1 | `cargo-lifecycle-group.tsx` | ⚠️ Slightly different from 0.14em |

### 7.17 `apps/web/app/globals.css` Density Redefinition

The web app globals.css (lines 40-42) redefines:
```css
--density-comfortable-control-height: 2.75rem;
--density-compact-control-height: 2.25rem;
--density-operational-control-height: 2rem;
```

But omits `--density-comfortable-row-height`, `--density-compact-row-height`, `--density-operational-row-height`, and the base `--density-row-height: 3rem` from `packages/ui/src/styles/globals.css`. The row height tokens only exist in the UI package, not in the web app globals.

---

## 8. Recommendations (P0–P3)

### Priority Matrix

```
                    HIGH IMPACT ←──────────────────→ LOW IMPACT
                    ┌────────────────────────────────────────────────┐
           HIGH     │ P0: Tariffs missing max-w-7xl                 │  P1: tracking-[0.14em] → token
          EFFORT    │ P0: global-error.tsx inline styles            │  P1: text-[0.6rem] → text-xxs
                    │ P0: Duration utility classes not used         │  P1: ContextRow adoption (Pattern B)
                    │ P0: font-numeric never used                   │  P1: Breakpoint alignment lg vs xl
                    ├────────────────────────────────────────────────┤
           LOW      │ P1: Title size inconsistency (2xl vs 3xl)    │  P2: z-toast, z-command
          EFFORT    │ P1: Description size inconsistency           │  P2: ease-* utility tokens
                    │ P1: RBAC jargon in operations-snapshot       │  P2: shadow-sticky adoption
                    │ P1: Permission names exposed in Dashboard    │  P2: min-w-[8rem] token
                    │ P1: BadgeGroup adoption (Dashboard, Int.)    │  P3: Chart height tokens
                    │ P1: StatusTile → MetricTile or variant       │  P3: Design system meta-violation
                    └────────────────────────────────────────────────┘
```

### P0 — Critical (Fix Immediately)

| # | Issue | Location | Impact | Fix | Effort |
|---|---|---|---|---|---|
| 1 | **Tariffs page missing `max-w-7xl`** | `apps/web/app/(platform)/app/tariffs/page.tsx` line 94 | Content stretches 100% width, inconsistent with all other pages | Add `mx-auto max-w-7xl` wrapper | 5 min |
| 2 | **`global-error.tsx` uses 17+ inline styles** | `apps/web/app/global-error.tsx` | Bypasses entire design system; cannot maintain tokens | Rewrite using Tailwind utility classes (Card, Button cannot be imported, but utility classes work) | 30 min |
| 3 | **Duration utility classes `duration-fast`/`duration-normal` never used** | 22+ files | Tokens defined but useless; hardcoded `duration-[var(...)]` everywhere | Replace `duration-[var(--motion-duration-fast)]` → `duration-fast` (22x) and `duration-[var(--motion-duration-normal)]` → `duration-normal` (16x) | 1 hr |
| 4 | **`font-numeric` never used** | `globals.css`, all data pages | Tabular figures not applied; numbers shift alignment | Add `font-numeric` to MetricTile values, table cells, data displays | 1 hr |

### P1 — High Priority

| # | Issue | Location | Fix | Effort |
|---|---|---|---|---|
| 5 | **Add `--tracking-uppercase: 0.14em` token** | `globals.css` + 12 files | Create token, replace all `tracking-[0.14em]` and `tracking-[0.12em]` | 30 min |
| 6 | **Add `--text-xxs` token** (0.6rem or 0.625rem) | `globals.css` + 8+ files | Add `--text-xxs: 0.6rem`, replace `text-[0.6rem]` and `text-[10px]` | 30 min |
| 7 | **Replace StatusTile with MetricTile operational variant** | `operations-snapshot.tsx` | Add `density="operational"` to MetricTile with: `shadow-none`, `text-xs uppercase`, `font-semibold`, `truncate` support | 1 hr |
| 8 | **Replace raw `flex justify-between` with `ContextRow` across overview panels** | `cargo-overview-header.tsx`, `tracking-overview-header.tsx`, `planning/page.tsx`, `tracking-analytics-section.tsx`, dashboard `page.tsx` | ~20 occurrences across 5 files | 1.5 hr |
| 9 | **Align split layout breakpoint to `lg:` across all pages** | All overview pages | Change `xl:grid-cols-[...]` → `lg:grid-cols-[...]` for consistency | 15 min |
| 10 | **Remove RBAC jargon from UI** | `operations-snapshot.tsx` line 50 | `"RBAC"` → `"Bloqueado"` | 5 min |
| 11 | **Hide permission names in Dashboard** | `apps/web/app/(platform)/app/page.tsx` lines 78-118 | Replace `"cargo.read"` with `"Cargas"`, etc. Use operational labels | 15 min |
| 12 | **Align title sizes** (2xl vs 3xl) | Capacity, Tariffs, Integrations, Tracking Detail | Pick one: either all `text-2xl` or all `text-3xl`. Recommend `text-2xl` for consistency with Dashboard/Cargo/Tracking/Planning | 15 min |
| 13 | **Align description sizes** (sm vs base) | Capacity, Tariffs, Integrations, Tracking Detail | Pick one: either all `text-sm` or all `text-base`. Recommend `text-sm` to keep descriptions secondary | 15 min |
| 14 | **Adopt BadgeGroup in Dashboard and Integrations** | Dashboard `page.tsx`, Integrations `page.tsx` | Replace raw `<Badge>` pairs with `<BadgeGroup>` | 15 min |

### P2 — Medium Priority

| # | Issue | Location | Fix | Effort |
|---|---|---|---|---|
| 15 | **Adopt ContentPanel component** | All 8 pages | Replace `mx-auto max-w-7xl flex flex-col gap-6` with `<ContentPanel>` | 30 min |
| 16 | **Tokenise `min-w-[8rem]`** | `dropdown-menu.tsx`, `select.tsx`, `combobox.tsx` | Add `--dropdown-min-width: 8rem` token | 15 min |
| 17 | **Adopt `shadow-sticky`** | `(platform)/layout.tsx` sticky header | Add `shadow-sticky` to the sticky header element | 10 min |
| 18 | **Ensure `z-toast` and `z-command` usage** | `toast.tsx`, `search-palette.tsx` | Verify Toaster and CommandPalette use their z-index tokens | 15 min |
| 19 | **Use `ease-in`, `ease-out`, `ease-in-out`** | Animations across components | Replace `cubic-bezier(...)` with easing token classes | 30 min |

### P3 — Low Priority / Future

| # | Issue | Location | Fix | Effort |
|---|---|---|---|---|
| 20 | **Tokenise chart card heights** | `dashboard-chart-card.tsx` | `min-h-[200px]` → `min-h-(--chart-height-sm)` etc. | 15 min |
| 21 | **Design system meta-violation** | `design-system/page.tsx` | `text-[0.68rem]` → use proper token | 5 min |
| 22 | **Add `density` prop to MetricTile** | `metric-tile.tsx` | Add comfortable/compact/operational density support (similar to Badge) | 1 hr |
| 23 | **Density row height consistency** | `apps/web/app/globals.css` | Add missing `--density-row-height: 3rem` to web globals.css | 5 min |

---

## Appendix A: Quick Reference Card

### MetricTile spec
```
┌──────────────────────────┐
│ p-4 (1rem)               │
│  ┌──────────────────────┐│
│  │ text-sm (14px) muted ││  ← Label
│  │ mt-1 (4px)           ││
│  │ text-2xl (24px) bold ││  ← Value | Badge (gap-3)
│  └──────────────────────┘│
│  mt-1 text-xs (12px)     │  ← Trend (success/destructive)
└──────────────────────────┘
```

### ContextRow spec
```
┌──────────────────────────────┐
│ px-3 (12px) py-2 (8px)      │
│ rounded-md (6px) bg-muted/30│
│  ┌─────────────┐ ┌─────────┐│
│  │ text-sm muted│ │text-sm  ││
│  │              │ │font-md  ││
│  └─────────────┘ └─────────┘│
│  mt-0.5 (2px) text-xs desc  │
└──────────────────────────────┘
```

### Context Panel (right card, overview)
```
┌───────────────────────────────────┐
│ CardHeader (gap-4)                │
│  [BadgeGroup] (optional)          │
│  CardTitle                        │
│  CardDescription                  │
├───────────────────────────────────┤
│ CardContent (flex flex-col gap-3) │
│  ┌───────────────────────────────┐│
│  │ ContextRow × N                ││
│  └───────────────────────────────┘│
│  Separator                        │
│  [Button size="sm"] [Button]     │
└───────────────────────────────────┘
```

### AccessState spec
```
┌───────────────────────────────────┐
│  flex flex-col items-center       │
│  justify-center gap-4 p-8 (2rem)  │
│                                   │
│  [badgeLabel] text-xs uppercase   │
│        🔒 h-12 w-12 (48px)        │
│                                   │
│  [status] text-xs muted-60        │
│  [title] text-lg (18px) semibold  │
│  [description] text-sm muted      │
└───────────────────────────────────┘
```

---

## Appendix B: Files Referenced

- `packages/ui/src/styles/globals.css` — Token definitions, @theme inline, dark mode, high contrast
- `apps/web/app/globals.css` — Web app global imports
- `packages/ui/src/components/metric-tile.tsx` — MetricTile
- `packages/ui/src/components/context-row.tsx` — ContextRow
- `packages/ui/src/components/access-state.tsx` — AccessState
- `packages/ui/src/components/badge-group.tsx` — BadgeGroup
- `packages/ui/src/components/badge.tsx` — Badge
- `packages/ui/src/components/button.tsx` — Button
- `packages/ui/src/components/card.tsx` — Card, CardHeader, CardContent, CardTitle, CardDescription
- `packages/ui/src/components/table.tsx` — Table primitives
- `packages/ui/src/components/data-table.tsx` — DataTable (TanStack)
- `packages/ui/src/components/error-card.tsx` — ErrorCard
- `packages/ui/src/components/layouts/content-panel.tsx` — ContentPanel
- `packages/ui/src/components/layouts/split-panel.tsx` — SplitPanel
- `packages/ui/src/components/blocks/page/page-header.tsx` — PageHeader
- `packages/ui/src/components/blocks/dashboard/dashboard-header.tsx` — DashboardHeader
- `packages/ui/src/components/blocks/dashboard/dashboard-kpi-grid.tsx` — DashboardKpiGrid
- `packages/ui/src/components/blocks/dashboard/dashboard-chart-card.tsx` — DashboardChartCard
- `apps/web/app/layout.tsx` — Root layout
- `apps/web/app/global-error.tsx` — Global error (bypass)
- `apps/web/app/error.tsx` — Error page
- `apps/web/app/(platform)/layout.tsx` — Platform layout
- `apps/web/app/(platform)/error.tsx` — Platform error
- `apps/web/app/(platform)/app/page.tsx` — Dashboard
- `apps/web/app/(platform)/app/operations-snapshot.tsx` — Dashboard StatusTile
- `apps/web/app/(platform)/app/cargo/page.tsx` — Cargo overview
- `apps/web/app/(platform)/app/cargo/CargoOverviewClient.tsx` — Cargo client
- `apps/web/components/cargo/cargo-overview-header.tsx` — Cargo context panel
- `apps/web/app/(platform)/app/tracking/page.tsx` — Tracking overview
- `apps/web/app/(platform)/app/tracking/TrackingOverviewClient.tsx` — Tracking client
- `apps/web/components/tracking/tracking-overview-header.tsx` — Tracking context panel
- `apps/web/components/tracking/tracking-analytics-section.tsx` — Analytics panels
- `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx` — Tracking detail
- `apps/web/app/(platform)/app/planning/page.tsx` — Planning overview
- `apps/web/app/(platform)/app/capacity/page.tsx` — Capacity overview
- `apps/web/app/(platform)/app/tariffs/page.tsx` — Tariffs overview
- `apps/web/app/(platform)/app/integrations/page.tsx` — Integrations overview
