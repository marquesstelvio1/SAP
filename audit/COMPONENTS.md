# SAPTM Component Inventory

> Complete audit of existing components, missing components, and migration plan
> Date: 2026-06-22
> Total: 42 existing + 11 missing = 53 target components

---

## 1. Component Classification

| Tier | Definition | Count |
|---|---|---|
| Atoms | Single-purpose, no dependencies | 18 |
| Molecules | Composed of atoms, single purpose | 12 |
| Organisms | Complex, composed of molecules | 8 |
| Templates | Page-level layout compositions | 6 |
| Pages | Route-specific, data-fetching | 15+ |

---

## 2. Existing Components (42) — `packages/ui/src/components/`

### 2.1 Atoms (18)

| # | Component | Status | Variants | Notes |
|---|---|---|---|---|
| 1 | Alert | ✅ Complete | info, success, warning, destructive | With icon support |
| 2 | Avatar | ✅ Complete | image/initials, sm/md/lg | Fallback initials |
| 3 | Badge | ✅ Complete | info, success, warning, destructive, outline, secondary | Border style |
| 4 | BadgeGroup | ✅ Complete | Horizontal wrap | For status arrays |
| 5 | Button | ✅ Complete | default, secondary, outline, ghost, destructive | sm/default/lg/icon, loading state |
| 6 | Card | ✅ Complete | With sub-components | Header, Content, Footer, Title, Description |
| 7 | Checkbox | ✅ Complete | With label, indeterminate | Radix-based |
| 8 | Input | ✅ Complete | text, email, password, search, number | With icon |
| 9 | Label | ✅ Complete | With required indicator | |
| 10 | Progress | ✅ Complete | determinate, indeterminate | |
| 11 | RadioGroup | ✅ Complete | With Label | Radix-based |
| 12 | SelectNative | ✅ Complete | Native select | With placeholder |
| 13 | Separator | ✅ Complete | horizontal, vertical | |
| 14 | Skeleton | ✅ Complete | text, card, table-row, metric-tile | Multiple variants |
| 15 | Spinner | ✅ Complete | sm, default, lg | |
| 16 | Switch | ✅ Complete | With label | Radix-based |
| 17 | Textarea | ✅ Complete | With character count | |
| 18 | Tooltip | ❌ Missing | | Using raw CSS group-hover |

**Missing Atoms:** Tooltip

### 2.2 Molecules (12)

| # | Component | Status | Variants | Notes |
|---|---|---|---|---|
| 1 | Breadcrumb | ❌ Missing | Auto-generated | |
| 2 | Calendar | ✅ Complete | Single, range | react-day-picker |
| 3 | Chart | ✅ Complete | bar, line, pie, area, radar | Recharts wrapper |
| 4 | Command | ✅ Complete | With search, keyboard nav | cmdk based |
| 5 | DataTable | ✅ Complete | Sorting, filtering, pagination, column visibility | TanStack Table |
| 6 | DatePicker | ✅ Complete | Calendar + Popover | |
| 7 | Dialog | ✅ Complete | default, alert-destructive | Radix-based |
| 8 | DropdownMenu | ✅ Complete | With items, sub-menus | Radix-based |
| 9 | Pagination | ✅ Complete | Page numbers, prev/next, page size | |
| 10 | Popover | ✅ Complete | With alignment | Radix-based |
| 11 | Sheet | ✅ Complete | left, right, top, bottom | Radix-based |
| 12 | Tabs | ✅ Complete | underline, pills | Radix-based |

**Missing Molecules:** Breadcrumb

### 2.3 Organisms (8)

| # | Component | Status | Notes |
|---|---|---|---|
| 1 | AccessState | 🟡 Inline duplication | Used in 10+ pages, inline |
| 2 | ContextRow | 🟡 Inline duplication | Used in 10+ pages, inline |
| 3 | EmptyState | ✅ Complete | With illustration, title, description, action |
| 4 | ErrorCard | ✅ Complete | With retry action |
| 5 | MetricTile | 🟡 Inline duplication | Used in 10+ pages, inline |
| 6 | SearchPalette | ✅ Complete | Cmd+K global search |
| 7 | ThemeProvider | ✅ Complete | next-themes wrapper |
| 8 | Timeline | ❌ Missing | Needed for tracking detail |
| 9 | Toast | ✅ Complete | Success/error/info/warning |

**Missing Organisms:** Timeline, **Consolidated:** AccessState, ContextRow, MetricTile need extraction

### 2.4 Templates (6)

| # | Component | Status | Notes |
|---|---|---|---|
| 1 | PlatformShell | ✅ Complete | Sidebar + header + content |
| 2 | AuthLayout | 🟡 Partial | Split-screen (inline in sign-in page) |
| 3 | SettingsLayout | ❌ Missing | Settings sidebar + content |
| 4 | AdminLayout | 🟡 Partial | Part of PlatformShell |
| 5 | ReportLayout | ❌ Missing | Charts + export cards |
| 6 | DetailLayout | ❌ Missing | Detail + timeline + resources |

**Missing Templates:** SettingsLayout, ReportLayout, DetailLayout

---

## 3. Missing Components — Priority Matrix

| Component | Type | Priority | Effort | Reason |
|---|---|---|---|---|
| **Breadcrumb** | Molecule | **P1** | 1 day | Navigation hierarchy essential for UX |
| **Tooltip** | Atom | **P1** | 0.5 day | Accessibility + consistency |
| **Timeline** | Organism | **P1** | 2 days | Required for tracking shipment detail |
| **SettingsLayout** | Template | **P0** | 1 day | Settings pages need consistent layout |
| **DetailLayout** | Template | **P1** | 1 day | Detail pages need consistent structure |
| **ReportLayout** | Template | **P2** | 1 day | Reports need consistent layout |
| **MetricTile (extract)** | Organism | **P1** | 0.5 day | Remove 10+ inline duplicates |
| **ContextRow (extract)** | Organism | **P1** | 0.5 day | Remove 10+ inline duplicates |
| **AccessState (extract)** | Organism | **P1** | 0.5 day | Remove 10+ inline duplicates |
| **ProgressCard** | Molecule | **P2** | 1 day | For capacity/billing usage bars |
| **StatCard** | Molecule | **P2** | 1 day | For dashboard metrics (variant of MetricTile) |
| **ConfirmationDialog** | Molecule | **P2** | 0.5 day | Wraps Dialog for destructive confirmations |

---

## 4. Inline Duplication Audit

### 4.1 MetricTile — 10 locations

| File | Lines | Variant |
|---|---|---|
| `app/(platform)/app/page.tsx` | ~30 | StatusTile (name varies) |
| `app/(platform)/app/tracking/page.tsx` | ~35 | MetricTile with badge |
| `app/(platform)/app/cargo/page.tsx` | ~30 | MetricTile with trend |
| `app/(platform)/app/capacity/page.tsx` | ~30 | MetricTile |
| `app/(platform)/app/planning/page.tsx` | ~25 | MetricTile |
| `app/(platform)/app/tariffs/page.tsx` | ~25 | MetricTile |
| `app/(platform)/app/admin/page.tsx` | ~25 | MetricTile |
| `app/(platform)/app/audit/page.tsx` | ~20 | MetricTile |
| `app/(platform)/app/integrations/page.tsx` | ~25 | MetricTile |
| `app/(platform)/app/notifications/page.tsx` | ~20 | MetricTile |

**Total duplicated lines: ~270** — Should be ~30 lines in shared component.

### 4.2 ContextRow — 8 locations

| File | Lines |
|---|---|
| `app/(platform)/app/page.tsx` | ~15 |
| `app/(platform)/app/cargo/page.tsx` | ~60 |
| `app/(platform)/app/capacity/page.tsx` | ~30 |
| `app/(platform)/app/planning/page.tsx` | ~40 |
| `app/(platform)/app/integrations/page.tsx` | ~25 |
| `app/(platform)/app/admin/page.tsx` | ~20 |
| `app/(platform)/app/tariffs/page.tsx` | ~15 |
| `app/(platform)/app/tracking/page.tsx` | ~10 |

**Total duplicated lines: ~215** — Should be ~25 lines in shared component.

### 4.3 AccessState — 6 locations

| File | Lines |
|---|---|
| `components/shell/platform-shell.tsx` | ~15 |
| `app/(platform)/app/page.tsx` | ~10 |
| `app/(platform)/app/tracking/page.tsx` | ~10 |
| `app/(platform)/app/cargo/page.tsx` | ~10 |
| `app/(platform)/app/capacity/page.tsx` | ~10 |
| `app/(platform)/app/planning/page.tsx` | ~10 |

**Total duplicated lines: ~65** — Should be ~15 lines in shared component.

### 4.4 Total Waste

| Pattern | Lines Duplicated | After Extraction | Savings |
|---|---|---|---|
| MetricTile | 270 | 30 | 240 |
| ContextRow | 215 | 25 | 190 |
| AccessState | 65 | 15 | 50 |
| **Total** | **550** | **70** | **480 lines saved** |

---

## 5. Component File Organization (Target)

```
packages/ui/src/components/
├── ui/                              # shadcn-style components
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── breadcrumb.tsx               [NEW]
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   ├── chart.tsx
│   ├── checkbox.tsx
│   ├── command.tsx
│   ├── data-table.tsx
│   ├── date-picker.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── empty-state.tsx
│   ├── error-card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── pagination.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── radio-group.tsx
│   ├── search-palette.tsx
│   ├── select-native.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── spinner.tsx
│   ├── switch.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── timeline.tsx                 [NEW]
│   ├── toast.tsx
│   └── tooltip.tsx                  [NEW]
│
├── data/                            # Data display organisms
│   ├── access-state.tsx
│   ├── context-row.tsx
│   ├── metric-tile.tsx
│   ├── stat-card.tsx                [NEW]
│   └── progress-card.tsx            [NEW]
│
├── layout/                          # Layout templates
│   ├── auth-layout.tsx              [EXTRACT]
│   ├── detail-layout.tsx            [NEW]
│   ├── report-layout.tsx            [NEW]
│   └── settings-layout.tsx          [NEW]
│
└── feedback/                        # Feedback components
    ├── confirmation-dialog.tsx      [NEW]
    └── toast.tsx (reference)
```

---

## 6. Component Dependency Graph

```
Tooltip (no deps)
Breadcrumb → Separator, DropdownMenu
Timeline → Card, Badge, Separator
SettingsLayout → Sidebar (new), Breadcrumb, Separator
DetailLayout → Breadcrumb, Card, Timeline, Tabs
ReportLayout → Card, Chart, Select, DatePicker
MetricTile → Card, Badge
ContextRow → Separator
AccessState → Badge
ConfirmationDialog → Dialog, Button, Alert
ProgressCard → Card, Progress
StatCard → Card, Badge, Skeleton
```

---

## 7. Component Test Coverage Matrix

| Component | Unit Tests | Integration Tests | Visual Tests | E2E Coverage |
|---|---|---|---|---|
| Button | ❌ | ❌ | ❌ | ✅ (via page forms) |
| Input | ❌ | ❌ | ❌ | ✅ |
| Dialog | ❌ | ❌ | ❌ | 🟡 Partial |
| DataTable | ❌ | ❌ | ❌ | 🟡 Partial |
| Form components | ❌ | ❌ | ❌ | ✅ (via E2E flows) |
| PlatformShell | ❌ | ❌ | ❌ | ✅ (navigation E2E) |
| **Target** | **80%** | **80%** | **Storybook** | **90% critical paths** |

---

## 8. Migration Sequence

```
Sprint 1: Foundation
├── Create: Tooltip component
├── Create: Breadcrumb component
├── Extract: MetricTile → packages/ui
├── Extract: ContextRow → packages/ui
└── Extract: AccessState → packages/ui

Sprint 2: Templates
├── Create: Timeline component
├── Create: SettingsLayout template
├── Replace: All inline MetricTile with shared component
├── Replace: All inline ContextRow with shared component
└── Replace: All inline AccessState with shared component

Sprint 3: Navigation
├── Implement: Breadcrumb in PlatformShell
├── Implement: SettingsLayout with sidebar nav
├── Create: DetailLayout template
└── Migrate: Tracking detail to use DetailLayout

Sprint 4: Enhancement
├── Create: ConfirmationDialog
├── Create: StatCard
├── Create: ProgressCard
├── Create: ReportLayout
└── Add: Tooltip to all truncated text elements

Sprint 5: Quality
├── Add: Unit tests for all shared components
├── Add: Storybook stories
├── Screen reader audit
└── Keyboard navigation audit
```

---

## 9. Implementation Specifications

### Breadcrumb Component

```typescript
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;           // Default: /app
  homeLabel?: string;          // Default: "Inicio"
  separator?: ReactNode;       // Default: "/"
}

interface BreadcrumbItem {
  label: string;
  href?: string;               // Omit for current page
  icon?: ReactNode;
}

// Auto-generation from route segments:
// /app/cargo/CRG-001/events
// → Inicio / Cargo / CRG-001 / Eventos
```

### Timeline Component

```typescript
interface TimelineProps {
  items: TimelineItem[];
  orientation?: "vertical" | "horizontal";
  variant?: "default" | "condensed";
}

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  status: "completed" | "current" | "pending" | "error" | "warning";
  icon?: ReactNode;
  actions?: TimelineAction[];
}

interface TimelineAction {
  label: string;
  onClick: () => void;
  variant?: "button" | "link";
}
```

### Tooltip Component

```typescript
interface TooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;       // Default: 700ms
  children: ReactNode;
}

// Radix-based with portal
```

### Settings Layout

```typescript
interface SettingsLayoutProps {
  children: ReactNode;
  activeSection: string;        // From URL params
  sections: SettingsSection[];
  organizationName?: string;    // Displayed in header
}

interface SettingsSection {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  badge?: string;               // Notification count
}
```

---

## 10. Component Scorecard

| Category | Current | Target | Gap |
|---|---|---|---|
| Atoms completeness | 17/18 | 18/18 | 1 missing (Tooltip) |
| Molecules completeness | 10/12 | 12/12 | 2 missing (Breadcrumb, ConfirmationDialog) |
| Organisms completeness | 6/9 | 9/9 | 3 missing/needs extraction |
| Templates completeness | 2/6 | 6/6 | 4 missing |
| Shared usage | 0/3 | 3/3 | All inline → shared |
| Test coverage | 0% | 80% | No component tests |
| Documentation | 0% | 80% | No Storybook |
| Accessibility | 60% | 95% | Missing ARIA patterns |
| **Composite** | **52/100** | **95/100** | **43 pts gap** |
