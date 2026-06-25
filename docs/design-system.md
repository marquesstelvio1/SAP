# SAPTM Design System

Enterprise logistics platform design system built on **shadcn/ui** (New York style) + **Tailwind CSS v4** + **Radix UI** primitives, powering Next.js 16 and React 19.

---

## Design Principles

1. **Enterprise density without sacrificing accessibility** — High-information screens must remain readable at WCAG 2.2 AA.
2. **Operational clarity over decorative UI** — Every pixel serves a purpose: throughput, tracking, exception handling.
3. **Semantic tokens, not raw utilities** — All color, spacing, and typography references go through CSS custom properties.
4. **Composition over props** — Prefer component composition (`<Card><CardHeader>...</CardHeader></Card>`) over monolithic prop-driven APIs.
5. **Accessibility by default** — Keyboard navigation, focus management, ARIA roles, and contrast ratios are non-negotiable.

---

## Design Tokens

Tokens are defined as CSS custom properties in `packages/ui/src/styles/globals.css` and exported via `packages/ui/src/tokens/index.ts`.

### Color

| Family | CSS Variable Pattern | Purpose |
|---|---|---|
| Semantic | `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive` | Core UI surfaces and text |
| Operational | `--success`, `--warning`, `--risk`, `--info` | Business status signals |
| Data | `--chart-1` through `--chart-5` | Chart series colors |
| Navigation | `--sidebar`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` | Sidebar and navigation surfaces |

**Rule:** Product UI must never reference raw hex or Tailwind color utilities. Always use semantic CSS variables.

### Typography

| Token | Stack | Usage |
|---|---|---|
| `--font-sans` | Inter / system sans-serif | Default UI text |
| `--font-mono` | JetBrains Mono / system monospace | Identifiers, audit evidence, technical values |
| `--font-numeric` | Tabular numeric variant | Operational metrics, tariff values |

### Density

| Variant | Width | Use Case |
|---|---|---|
| `comfortable` | `w-72` (288px) | Enterprise forms and panels |
| `compact` | `w-64` (256px) | Dense admin and navigation (default) |
| `operational` | `w-56` (224px) | High-throughput tracking and control-room |

### Spacing Scale

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96` — via Tailwind `gap-*`, `p-*`, `m-*` utilities.

### Border Radius

| Token | Value |
|---|---|
| `--radius-sm` | `calc(--radius - 0.25rem)` |
| `--radius-md` | `--radius (0.5rem)` |
| `--radius-lg` | `calc(--radius + 0.25rem)` |
| `--radius-xl` | `calc(--radius + 0.5rem)` |

Full reference: [docs/design-system/tokens.md](design-system/tokens.md)

---

## Component Architecture

### Layer Model

```
shadcn Registry ──► packages/ui/src/components/
                          ├── primitives/       (Button, Input, Dialog, etc.)
                          ├── blocks/           (dashboard-header, page-header, etc.)
                          ├── charts/           (chart-card)
                          └── layouts/          (content-panel, split-panel)
                                   │
                                   ▼
                          @saptm/ui exports
                                   │
                                   ▼
                          apps/web/components/
                          ├── shell/            (platform-shell, navigation, brand)
                          ├── features/         (feature-specific components)
                          └── ui/               (project-specific UI overrides)
```

### Primitive Categories

| Category | Components | Documentation |
|---|---|---|
| Foundation | Button, Input, Badge, Card, Avatar, Separator, Tooltip | `base-primitives.md` |
| Navigation | Sidebar, SidebarNav, SidebarNavSection, Breadcrumb, Tabs | `base-primitives.md` |
| Data Display | Table, DataTable, Chart, Calendar, BadgeGroup | `base-primitives.md` |
| Feedback | Toast, Alert, Dialog, Sheet, Skeleton, Spinner, EmptyState, ErrorCard | `base-primitives.md` |
| Overlays | Dialog, Sheet, Drawer, AlertDialog, Popover, Tooltip, DropdownMenu | `base-primitives.md` |
| Forms | Field, FieldGroup, Input, Select, Checkbox, RadioGroup, Textarea, Combobox, DatePicker | `base-primitives.md` |
| Search | Command, SearchPalette | `base-primitives.md` |
| Blocks | dashboard-header, dashboard-kpi-grid, dashboard-chart-card, page-header, section-card | `blocks/` |
| Charts | chart-card (loading/empty/error/retry states, responsive, dark mode) | `charts/` |
| Layouts | content-panel, split-panel | `layouts/` |

### Sidebar Component Family

The sidebar follows the `SidebarProvider → Sidebar → SidebarInset` pattern:

```
<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      <SidebarBrand />
    </SidebarHeader>
    <SidebarContent>
      <SidebarNav>
        <SidebarNavSection label="Group">
          <SidebarNavLink active disabled asChild />
        </SidebarNavSection>
      </SidebarNav>
    </SidebarContent>
    <SidebarFooter>
      <SidebarUserCard name email avatar />
    </SidebarFooter>
  </Sidebar>
  <SidebarInset>
    <!-- main content -->
  </SidebarInset>
</SidebarProvider>
```

**Available primitives:** `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarBrand`, `SidebarNav`, `SidebarNavSection`, `SidebarNavItem`, `SidebarNavLink`, `SidebarUserCard`, `SidebarInset`, `sidebarVariants`.

**Density variants:** `comfortable` | `compact` | `operational` (controlled via `SidebarProvider` or per-instance).

---

## Usage Rules

### Imports

```tsx
// Preferred: aggregate imports
import { Button, Sidebar, SidebarNavLink } from "@saptm/ui";

// Direct imports (tree-shaking)
import { cn } from "@saptm/ui/lib/utils";
```

### Styling

- Use `cn()` for conditional class merging
- Use semantic tokens: `bg-background`, `text-muted-foreground`, `border-sidebar-border`
- Use `gap-*` over `space-x-*` / `space-y-*`
- Use `size-*` for equal width + height
- Never use raw color utilities (`bg-blue-500`, `text-gray-700`)

### Composition

- Prefer composition over props: `<Card><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>`
- Dialog, Sheet, Drawer must always include an accessible title
- Forms use `FieldGroup` → `Field` → `FieldLabel` / `FieldContent` / `FieldDescription` / `FieldError`
- Buttons do not receive custom loading props; compose `Spinner` + `disabled`

### Navigation

- `SidebarNavLink` with `asChild` for Next.js `<Link>` integration
- `active` prop for current page indication
- `disabled` for RBAC-restricted items (non-allowed items render as `<span>`)
- Mobile: use `Sheet` with `SidebarProvider` wrapper

---

## Layout Patterns

### App Shell

```
SidebarProvider
├── Sidebar (desktop, collapsible: w-64 ↔ w-16)
│   ├── SidebarHeader (brand + org switcher)
│   ├── SidebarContent (navigation groups)
│   └── SidebarFooter (user card + sign out)
└── SidebarInset
    ├── Header (sticky, breadcrumbs, search, RBAC badge)
    │   ├── MobileNavigation (Sheet, lg:hidden)
    │   ├── CollapseToggle (lg:inline-flex)
    │   └── BreadcrumbNav
    └── Main (#main-content, skip-to-content target)
```

### Responsive Behavior

| Breakpoint | Sidebar | Layout |
|---|---|---|
| Mobile (< 1024px) | Hidden (Sheet drawer) | Full-width content |
| Desktop (≥ 1024px) | Visible, collapsible | Sidebar + Inset |

### Available Layout Blocks

| Component | Path |
|---|---|
| `content-panel` | `packages/ui/src/components/layouts/content-panel.tsx` |
| `split-panel` | `packages/ui/src/components/layouts/split-panel.tsx` |

Full reference: [design-system/base-primitives.md](design-system/base-primitives.md)

---

## Accessibility

Baseline: **WCAG 2.2 Level AA**.

### Requirements

- All interactive elements keyboard accessible
- Visible focus indicators with `:focus-visible` ring styles
- Modal/sheet focus trapping (open) and release (close)
- Skip-to-content link (`#main-content`)
- Color contrast: 4.5:1 (normal text), 3:1 (large text), 3:1 (non-text)
- Target size minimum: 24×24 CSS pixels
- ARIA roles and states on all custom interactive components
- `prefers-reduced-motion` respected
- High contrast mode support

Full audit: [design-system/wcag-audit.md](design-system/wcag-audit.md)

---

## File Reference

| Document | Contents |
|---|---|
| `design-system/design-system-strategy.md` | Strategy, principles, prohibited items, acceptance criteria |
| `design-system/tokens.md` | Color, typography, density, spacing, radius token reference |
| `design-system/base-primitives.md` | Component catalog with import contract and usage rules |
| `design-system/shadcn-foundation.md` | shadcn/ui configuration and setup |
| `design-system/wcag-audit.md` | WCAG 2.2 AA audit, checklist, testing tools |

---

## Governance

- New tokens require Design System and Architect approval.
- Component-specific tokens are prohibited unless the semantic token set cannot represent the state.
- No product pages, dashboards, CRUD screens, or custom table implementations without design system approval.
- All mutations use idempotency keys; all mutations create audit records.
