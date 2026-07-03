# Design System Compliance Audit — Custom Components

## Summary

| Component | Violations | Severity |
|-----------|-----------|----------|
| `DashboardChartCard` | 4 | Critical |
| `ChartCard` | 4 | Critical |
| `PageHeader` | 1 | High |
| `DashboardHeader` | 0 | Clean |
| `Combobox` | 4 | High |
| `DataTable` | 3 | High |
| `AccessState` | 3 | Medium |
| `ContextRow` | 1 | Medium |
| `EmptyState` | 2 | Medium |
| `ErrorCard` | 1 | Medium |
| `JsonBlock` | 2 | Medium |
| `ThemeToggle` | 2 | Low |
| `Timeline` | 3 | Medium |
| `DatePicker` | 1 | Low |
| `BadgeGroup` | 1 | Low |
| `DashboardKpiGrid` | 0 | Clean |
| `SectionCard` | 0 | Clean |
| `ContentPanel` | 0 | Clean |
| `SplitPanel` | 0 | Clean |
| `Field` (all) | 0 | Clean |
| `MetricTile` | 0 | Clean |
| `SearchPalette` | 0 | Clean |
| `SelectNative` | 0 | Clean |
| `Spinner` | 0 | Clean |
| `ThemeProvider` | 0 | Clean |
| `Toast` | 0 | Clean |
| `utils.ts` | 0 | Clean |

---

## Detailed Violations

### 1. `blocks/dashboard/dashboard-chart-card.tsx` — CRITICAL

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 1.1 | **Duplicate of `charts/chart-card.tsx`** | 1–102 | Near-identical duplicate of `ChartCard` — same structure (Card > CardHeader > CardTitle/CardDescription > CardContent), same state handling (loading/error/empty), same props. Differences are cosmetic (simpler error display). Should be consolidated into one component. |
| 1.2 | **Hardcoded arbitrary values** | 25–27 | `min-h-[200px]`, `min-h-[300px]`, `min-h-[400px]` in `heightMap`. These should use CSS custom properties or standard Tailwind sizing. |
| 1.3 | **Hardcoded arbitrary value** | 57 | `h-[calc(100%-2rem)]` for loading skeleton — inline calc with hardcoded `2rem`. |
| 1.4 | **Hardcoded SVG** | 74–91 | Inline SVG for empty state (bar chart icon) — duplicated verbatim from `charts/chart-card.tsx:100–118`. Should use a Lucide icon. |

### 2. `charts/chart-card.tsx` — CRITICAL

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 2.1 | **Duplicate of `DashboardChartCard`** | 1–129 | Same structure as `DashboardChartCard` — see 1.1. |
| 2.2 | **Hardcoded inline style values** | 36, 49, 56, 62 | `height = 300`, `style={{ minHeight: height }}`, `style={{ height: height - 80 }}`, `style={{ height: \`${Math.max(20, Math.random() * 80)}%\` }}` — chart sizing uses arbitrary numbers inline instead of CSS variables. |
| 2.3 | **Hardcoded SVG** | 69–83, 100–117 | Two inline SVGs (error exclamation icon + empty state chart icon) — should be Lucide icons (`AlertCircle`, `BarChart3`). |
| 2.4 | **Hardcoded retry button sizing** | 92 | `px-3 py-1.5` — manually sized button instead of using `Button` component's `size="sm"` variant. |

### 3. `blocks/page/page-header.tsx` — HIGH

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 3.1 | **Near-duplicate of `DashboardHeader`** | 12–26 | Identical structure, identical className patterns. Only difference: `PageHeader` uses `text-xl font-bold tracking-heading md:text-2xl` (responsive), while `DashboardHeader` uses `text-2xl font-bold tracking-heading`. Should be consolidated into a single `PageHeader` component with an optional `size` prop. |

### 4. `combobox.tsx` — HIGH

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 4.1 | **Duplicates shadcn `Command` sub-components** | 123–196 | `ComboboxInput` re-implements `CommandInput` from `command.tsx`, `ComboboxItem` re-implements `CommandItem`, `ComboboxEmpty` re-implements `CommandEmpty`. These use their own styling (e.g., `flex h-11 w-full` vs `command.tsx`'s `h-10`). Should delegate to the existing `Command` sub-components. |
| 4.2 | **Hardcoded arbitrary value** | 138 | `h-11` in `ComboboxInput` — hardcoded height instead of density token. Should be `h-[var(--density-compact-control-height)]`. |
| 4.3 | **Hardcoded arbitrary value** | 98, 154 | `max-h-72` — hardcoded max height for dropdown list. Should use a token or standard value. |
| 4.4 | **Missing `use client` boundary considerations** | 1 | Uses `"use client"` and `cmdk` directly instead of wrapping the existing shadcn `Command` primitives. |

### 5. `data-table.tsx` — HIGH

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 5.1 | **Duplicates `pagination.tsx` functionality** | 277–343 | `DataTablePagination` is a custom pagination UI that duplicates the existing shadcn `Pagination` component family (available at `pagination.tsx`). Should compose from `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink` instead. |
| 5.2 | **Hardcoded arbitrary values** | 291, 304–338 | `h-7` (page size select), `size-7` (pagination buttons), `size-3.5` (icons) — all hardcoded. Should use `h-[var(--density-operational-control-height)]` and density-aware sizing. |
| 5.3 | **Hardcoded empty state height** | 180 | `h-24` in empty state `TableCell` — hardcoded height should use a density token. |

### 6. `access-state.tsx` — MEDIUM

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 6.1 | **Hardcoded opacity modifiers** | 79–82, 87 | `text-muted-foreground/50`, `text-muted-foreground/60` — semantic colors with hardcoded opacity overrides. Should use dedicated tokens or `text-muted-foreground` without opacity. |
| 6.2 | **Prop overloading** | 41–42, 46 | `message` and `description` props serve the same purpose (both rendered as description). `status` is confusingly named (reads like a status enum but is text). `granted` boolean radically changes component rendering (line 49–58). Should split into separate components (`AccessStateBadge`, `AccessStateBlock`). |
| 6.3 | **Hardcoded padding** | 65 | `p-8` — should use density panel padding tokens (`var(--density-comfortable-panel-padding)` or similar). |

### 7. `context-row.tsx` — MEDIUM

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 7.1 | **Hardcoded opacity modifier** | 24 | `bg-muted/30` — uses opacity override on semantic color. Should use a dedicated muted background token or standard `bg-muted` pattern. Duplicated pattern across components. |

### 8. `empty-state.tsx` — MEDIUM

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 8.1 | **Hardcoded padding** | 17 | `px-6 py-12` — `py-12` is an unusually large padding value. Compare to other components using `p-6`/`p-8` from Card. Should be consistent with Card padding or use density tokens. |
| 8.2 | **Hardcoded icon container size** | 23 | `size-12`, `[&_svg]:size-6` — hardcoded icon container sizing. Should use standard sizing tokens. |

### 9. `error-card.tsx` — MEDIUM

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 9.1 | **Hardcoded padding** | 16 | `p-8` — same violation as `AccessState` (6.3). Should use density panel padding tokens. |

### 10. `json-block.tsx` — MEDIUM

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 10.1 | **Hardcoded tracking value** | 17 | `tracking-[0.14em]` — should use the `tracking-uppercase` token which is defined as `0.14em` in globals.css:54. |
| 10.2 | **Hardcoded max-height** | 18 | `max-h-56` — should use a token or standard layout height. |

### 11. `theme-toggle.tsx` — LOW

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 11.1 | **Hardcoded icon size** | 55–56 | `size-[1.2rem]` — should use standard icon sizing like `size-4` or `size-5`. |
| 11.2 | **Hardcoded button radius** | 52 | `rounded-full` overrides the default Button border radius. Should use `rounded-md` or the theme's default radius unless there is a specific design reason. |

### 12. `timeline.tsx` — MEDIUM

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 12.1 | **Hardcoded dot/icon sizes** | 66, 70 | `size-7` (dot container), `size-3` / `size-2` (status icons) — should use sizing tokens. |
| 12.2 | **Hardcoded spacing** | 59 | `gap-4`, `pb-8` (item padding), `pb-4` (content padding) — hardcoded spacing should use token values. |
| 12.3 | **Hardcoded ring** | 14 | `ring-4 ring-primary/20` — hardcoded ring width and opacity. Should use `ring-[3px] ring-ring/50` pattern consistent with other components (combobox, select-native). |

### 13. `date-picker.tsx` — LOW

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 13.1 | **Hardcoded width** | 32 | `w-72` — hardcoded trigger width prevents natural sizing. Should be `w-full` or `max-w-xs` for consistency with other form controls. |

### 14. `badge-group.tsx` — LOW

| # | Violation | Line(s) | Finding |
|---|-----------|---------|---------|
| 14.1 | **Overly thin wrapper** | 3–21 | This component is a trivial mapping loop that could be inlined at call sites. Does not justify a dedicated component file. |

---

## Cross-Cutting Issues

### A. Duplicated Components

| Components | Description |
|-----------|-------------|
| `ChartCard` ↔ `DashboardChartCard` | Near-identical implementation of chart container with loading/error/empty states. **Should be consolidated into one.** |
| `DashboardHeader` ↔ `PageHeader` | Near-identical page header components. Only difference is responsive title sizing. **Should be consolidated.** |
| `ComboboxInput/Item/Empty` vs `CommandInput/Item/Empty` | Combobox re-implements parts of the existing shadcn `Command` component family. Should use `Command` sub-components directly. |
| `DataTablePagination` vs `Pagination` | Custom pagination UI duplicates the existing shadcn `Pagination` component. Should compose from it. |

### B. Recurring Patterns That Should Be Tokenized

| Pattern | Occurrences | Recommendation |
|---------|-------------|---------------|
| `bg-muted/30` | `context-row.tsx:24` | Create `--bg-muted-subtle` token or use `bg-muted` |
| `p-8` for error cards | `access-state.tsx:65`, `error-card.tsx:16` | Use `var(--density-comfortable-panel-padding)` |
| `size-10` rounded-full icon circles | `chart-card.tsx:69,101`, `dashboard-chart-card.tsx:74` | Define an `--icon-circle-size` token |
| `tracking-[0.14em]` | `json-block.tsx:17` | Should be `tracking-uppercase` (already defined) |

### C. Inline SVGs

| File | Line | Icon |
|------|------|------|
| `chart-card.tsx` | 69–83 | Error exclamation circle |
| `chart-card.tsx` | 100–117 | Empty state bar chart |
| `dashboard-chart-card.tsx` | 74–91 | Empty state bar chart |

All should be replaced with Lucide icons (`AlertCircle`, `BarChart3`, etc.) for consistency with the rest of the design system.

---

## Components That Pass Audit (Clean)

- `DashboardHeader` — Uses `tracking-heading`, `text-muted-foreground`, all standard tokens.
- `DashboardKpiGrid` — Composes `MetricTile` and `SkeletonMetricTile` correctly.
- `SectionCard` — Composes `Card` sub-components. Clean.
- `ContentPanel` — Uses standard Tailwind utilities only. Clean.
- `SplitPanel` — Uses standard Tailwind utilities only. Clean.
- `Field` (all 10 sub-components) — Well-structured, uses standard tokens.
- `MetricTile` — Properly uses `Card` and `Badge`. Clean.
- `SearchPalette` — Properly delegates to shadcn `Command` components. Clean.
- `SelectNative` — Uses density tokens correctly. Clean.
- `Spinner` — Minimal, uses standard token `size-5`. Clean.
- `ThemeProvider` — Thin wrapper, correct. Clean.
- `Toast` — Wraps Sonner with design tokens. Clean.
- `utils.ts` — Standard `cn()` helper. Clean.

---

## Recommendations (Priority Order)

1. **Consolidate `ChartCard` and `DashboardChartCard`** — Keep one, remove the other. Prefer `ChartCard` with an additional `size` prop.
2. **Consolidate `PageHeader` and `DashboardHeader`** — Keep `PageHeader`, add `size` prop.
3. **Refactor `Combobox` to use `Command` sub-components** — Remove custom `ComboboxInput`, `ComboboxItem`, `ComboboxEmpty`.
4. **Refactor `DataTablePagination` to use `Pagination` components** — Compose from the existing shadcn `Pagination` family.
5. **Replace inline SVGs** with Lucide icons in `ChartCard` and `DashboardChartCard`.
6. **Replace `tracking-[0.14em]`** with `tracking-uppercase` in `JsonBlock`.
7. **Replace hardcoded sizing** (`h-11`, `h-7`, `size-7`, `p-8`, `py-12`, `h-24`) with design tokens.
8. **Replace hardcoded opacity patterns** (`bg-muted/30`, `text-muted-foreground/50`) with proper tokens.
9. **Simplify `AccessState`** — split `granted` mode into separate component, deduplicate `message`/`description`.
