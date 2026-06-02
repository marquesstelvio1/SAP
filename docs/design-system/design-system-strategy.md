# Phase 8 — Design System Strategy

## Position

The design system is built on shadcn/ui composition and semantic tokens. It must exist before product screens.

No product page, dashboard, CRUD, or workflow UI is allowed until the design-system foundation is approved.

## Design Principles

- Enterprise density without sacrificing accessibility.
- Operational clarity over decorative UI.
- Semantic colors and tokens, not raw utility colors.
- Reusable form, table, dialog, sheet, and navigation patterns.
- WCAG 2.2 AA as the baseline.
- Dark mode and high-contrast readiness through tokens.

## Token Families

| Family | Examples |
| --- | --- |
| Color | background, foreground, primary, secondary, muted, destructive, warning, success, risk |
| Typography | heading, body, label, numeric, monospace |
| Spacing | stack, inline, section, panel, form, table density |
| Radius | card, input, badge, modal |
| Elevation | panel, overlay, command, sticky header |
| Motion | entrance, exit, loading, reduced-motion |
| State | hover, focus, active, disabled, invalid, loading |

## Component Foundations

| Need | shadcn/ui Basis |
| --- | --- |
| Actions | Button |
| Forms | FieldGroup, Field, Input, Select, Checkbox, RadioGroup, Textarea |
| Data display | Table, Card, Badge, Avatar |
| Navigation | Sidebar, NavigationMenu, Breadcrumb, Tabs |
| Overlays | Dialog, Sheet, Drawer, AlertDialog |
| Feedback | Sonner, Alert, Progress, Skeleton, Spinner |
| Search/command | Command inside Dialog |
| Analytics | Chart and Card composition |
| Empty/loading states | Empty, Skeleton, Spinner |

## SAPTM Enterprise Patterns

| Pattern | Purpose |
| --- | --- |
| Operational shell | Tenant switcher, facility scope, role-aware navigation |
| Dense data table | Cargo, shipment, exception, movement lists |
| Timeline panel | Operational event chronology |
| Exception drawer | Assignment, severity, impact, resolution workflow |
| KPI card set | Throughput, dwell time, SLA, exception rate |
| Detail sheet | Read-side inspection without navigation loss |
| Command palette | Fast enterprise navigation and actions |
| Audit evidence panel | Sensitive action history and export controls |

## shadcn/ui Rules

- Use existing shadcn/ui components before custom markup.
- Use semantic tokens such as `bg-background` and `text-muted-foreground`.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Use `size-*` when width and height are equal.
- Use `cn()` for conditional classes.
- Dialog, Sheet, and Drawer must always include an accessible title.
- Forms use FieldGroup and Field composition.
- Buttons do not receive custom loading props; compose Spinner and disabled state.
- Icons inside buttons use the component-supported icon pattern.

## Design-System Implementation Order

1. Token naming and semantic color model.
2. Typography and density scale.
3. shadcn/ui initialization.
4. Base components and variants.
5. Form patterns.
6. Table and data-state patterns.
7. Dialog/sheet/drawer patterns.
8. Navigation shell primitives.
9. Chart and KPI primitives.
10. Accessibility and visual regression tests.

## Prohibited Before Approval

- Dashboard pages.
- CRUD screens.
- Shipment/cargo feature screens.
- Custom table implementations.
- Raw form layouts outside design-system rules.
- Raw color utilities for business status.

## Acceptance Criteria

- `@saptm/ui` owns component primitives and tokens.
- Components comply with shadcn/ui composition rules.
- Accessibility states are documented.
- Visual regression strategy exists before complex screens.

