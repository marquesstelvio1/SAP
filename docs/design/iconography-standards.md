# Iconography Standards

> **Departamento:** Visual Design
> **Versão:** 1.0
> **Data:** 2026-07-02

## 1. Icon Library

SAPTM uses **lucide-react** exclusively for all application icons. Lucide is the icon library bundled with shadcn/ui and provides consistent, geometric icons that match the design system.

### Why Lucide

- Consistent stroke width (2px default)
- SVG-based (scalable, colorable via `currentColor`)
- Tree-shakeable (import only what you use)
- Active maintenance and community
- Native TypeScript support with `LucideIcon` type
- Zero external dependencies

### Prohibited

- **Font Awesome** (inconsistent stroke, font-based)
- **Heroicons** (different stroke philosophy)
- **Custom SVG icons in app code** (create a component if needed)
- **Emoji as icons** (accessibility, inconsistent rendering)
- **Inline `<svg>` in components** (use Lucide or extracted icon components)

## 2. Sizing Conventions

Icons use a fixed size scale that maps to the typography scale:

| Context | Size | Tailwind Class | Usage |
|---------|------|----------------|-------|
| Inline with text (sm) | 14px | `size-3.5` | Small labels, table cells, badges |
| Inline with text (md) | 16px | `size-4` | Default — buttons, menu items, form fields |
| Standalone (lg) | 20px | `size-5` | Section headers, empty state icons |
| Hero / Feature | 24px | `size-6` | Page headers, primary CTAs, metric tiles |
| Illustration | 32px+ | `size-8`, `size-12` | Empty states, error states, onboarding |

### Default Sizing by Component

```tsx
// Buttons (all variants)
<Button><Icon className="size-4" /> Label</Button>

// Menu items (sidebar, dropdown, command palette)
<SidebarMenuButton><Icon className="size-4 shrink-0" /> Label</SidebarMenuButton>

// Table headers / cells
<TableHead><Icon className="size-3.5" /></TableHead>

// Badges
<Badge><Icon className="size-3" /> Label</Badge>

// Empty states
<EmptyState icon={<Icon className="size-6" />} />

// Metric tiles
<MetricTile /> // Icon passed via icon prop, rendered at 6 (24px)
```

### Rule: Icon size matches line height

- `text-xs` (12px) → `size-3` (12px)
- `text-sm` (14px) → `size-3.5` (14px)
- `text-base` (16px) → `size-4` (16px)
- `text-lg` (18px) → `size-5` (20px, slightly larger for emphasis)
- `text-xl`+ (20px+) → `size-6` (24px)

## 3. Color Usage for Icons

Icons inherit color from their parent text via `currentColor`. Explicit color is applied only when the icon has semantic meaning.

### Semantic Icon Colors

| Context | Color Token | Example |
|---------|------------|---------|
| Default | `text-foreground` / `text-muted-foreground` | Navigation, actions |
| Success | `text-success` | Confirmed operations, green status |
| Warning | `text-warning` | Near-limit, pending review |
| Destructive | `text-destructive` | Errors, cancellations, critical alerts |
| Risk | `text-risk` | Safety issues, hazardous cargo |
| Info | `text-info` | Informational, help, tips |
| Brand | `text-primary` | Primary actions, selected states |
| Disabled | `text-muted-foreground/50` | Disabled controls |

### Icon Color Rules

1. **Do not hardcode icon colors** — always use semantic color tokens
2. **Interactive icons** (buttons, menu items) must have hover/focus states
3. **Decorative icons** should use `text-muted-foreground` (neutral, non-distracting)
4. **Status icons** must meet WCAG AA contrast against their background
5. **Never use raw hex colors** on icons — use Tailwind `text-*` utilities

### Operational Status Icon Mapping

```tsx
// Cargo / tracking status icons — use lucide-react icons
import { 
  CheckCircleIcon,    // confirmed / delivered
  AlertTriangleIcon,  // warning / exception
  XCircleIcon,        // cancelled / blocked
  ClockIcon,          // pending / in progress
  TruckIcon,          // in transit
  ContainerIcon,      // cargo shipment
  AnchorIcon,         // port operations (if available)
  TrainIcon,          // rail operations (if available)
  MapPinIcon,         // location / geofence
  RouteIcon,          // route / itinerary
} from "lucide-react";
```

## 4. When to Use Icons vs Text

### Use Icons When

- **Navigation**: Menu items, sidebar links, tabs
- **Actions**: Buttons with clear, universally understood actions (edit, delete, add, search)
- **Status**: Visual shorthand for operational states (checked, pending, error)
- **Empty states**: Visual reinforcement of the empty state message
- **Data visualization**: Chart legends, metric indicators

### Use Text Instead When

- **Ambiguous concepts**: "Consignee" cannot be represented by a single icon
- **Complex actions**: "Generate report" needs text + icon, not icon alone
- **Legal/compliance**: Regulatory labels must be explicit text
- **Accessibility-critical**: Never rely solely on icons for critical information

### Icon + Text Pattern (Preferred)

```tsx
// GOOD — icon supports text
<Button variant="outline" size="sm">
  <FileDownIcon className="size-4" />
  Exportar
</Button>

// AVOID — icon alone without clear context
<Button variant="ghost" size="icon" aria-label="Exportar">
  <FileDownIcon className="size-4" />
</Button>
```

Use icon-only buttons only when:
- The icon is universally understood (search, close, menu hamburger)
- An `aria-label` is always provided
- The component is in a crowded toolbar/header

## 5. Custom / Domain-Specific Icons

For logistics-specific concepts that Lucide does not cover:

- **Train / Rail**: Use `TrainIcon` (lucide-react 0.400+ includes it) or compose from `RailSymbolIcon`
- **Ship / Vessel**: Use `ShipIcon` or `ContainerIcon` as closest match
- **Container**: Use `ContainerIcon` (lucide-react)
- **Yard / Stack**: Use `LayersIcon` as approximation
- **Weighbridge**: Use `WeightIcon` (lucide-react)

If a needed icon is missing from Lucide, **create an abstraction in `packages/ui/src/icons/`** using standard SVG with the same stroke width and geometry conventions.

### Custom Icon Guidelines

```tsx
// packages/ui/src/icons/train.tsx
import type { LucideProps } from "lucide-react";

export function TrainIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Custom path data */}
    </svg>
  );
}
```

## 6. Accessibility

1. All icons must have `aria-hidden="true"` when used alongside text
2. Standalone icon buttons must have `aria-label`
3. Decorative icons in cards/tiles should use `aria-hidden="true"`
4. Status-indicating icons should be accompanied by screen-reader text:
   ```tsx
   <CheckCircleIcon className="size-4 text-success" aria-hidden="true" />
   <span className="sr-only">Confirmado</span>
   ```
5. Icons must meet WCAG SC 1.4.1 (Use of Color) — never convey information through color alone

## 7. Icon Imports

Always import specific icons (tree-shakeable):

```tsx
// GOOD
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react";

// BAD
import * as Icons from "lucide-react";
// Or
import { Icons } from "lucide-react";
```

## 8. Icon Component Type

Use the `LucideIcon` type for icon props:

```tsx
import type { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  label: string;
}
```
