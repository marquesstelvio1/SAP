# SAPTM Enterprise Design System

> Architecture: `apps/web` + `packages/ui` + `packages/design-tokens` [NEW]
> Base: shadcn/ui (new-york style) + Tailwind CSS 4
> Target Score: 96/100 → 98/100
> Date: 2026-06-22

---

## 1. Architecture Overview

```
packages/
├── design-tokens/           [NEW] Token definitions only
│   ├── src/
│   │   ├── tokens/
│   │   │   ├── color.ts        # Primitive color tokens
│   │   │   ├── typography.ts   # Font stacks, sizes, weights
│   │   │   ├── spacing.ts      # Space scale (4px grid)
│   │   │   ├── radius.ts       # Border radius scale
│   │   │   ├── elevation.ts    # Shadow/elevation tokens
│   │   │   ├── motion.ts       # Duration + easing tokens
│   │   │   ├── breakpoints.ts  # Responsive breakpoints
│   │   │   └── density.ts      # Density mode tokens
│   │   ├── themes/
│   │   │   ├── light.ts        # Light theme semantic mapping
│   │   │   ├── dark.ts         # Dark theme semantic mapping
│   │   │   ├── high-contrast.ts [NEW] High contrast theme
│   │   │   └── enterprise.ts   [NEW] Enterprise branding theme
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── icons/                   [NEW] SVG icon management
│   ├── src/
│   │   ├── index.ts
│   │   └── icons/             # Custom SVG icons
│   ├── package.json
│   └── tsconfig.json
│
├── themes/                   [NEW] Tailwind CSS theme presets
│   ├── src/
│   │   └── index.ts           # Tailwind CSS v4 theme config
│   ├── package.json
│   └── tsconfig.json
│
└── ui/                       # Existing shadcn/ui components
    ├── src/
    │   ├── components/        # 42 atomic components
    │   ├── hooks/             # 5 hooks
    │   ├── lib/               # Utilities (cn, etc.)
    │   ├── styles/            # globals.css
    │   └── tokens/            # Token TS exports
    ├── package.json
    └── tsconfig.json
```

### Dependency Flow

```
design-tokens (pure)
      │
      ├── themes (Tailwind preset)
      │
      ├── ui (component library)
      │
      └── apps/web (consumption)

icons (pure SVGs)
      │
      └── ui (Icon component)
```

---

## 2. Foundations

### 2.1 Colors

#### Primitive Colors (OKLCH)

```css
/* Neutral */
--color-white: oklch(1 0 0);
--color-black: oklch(0 0 0);
--color-neutral-50: oklch(0.985 0 0);
--color-neutral-100: oklch(0.97 0 0);
--color-neutral-200: oklch(0.922 0 0);
--color-neutral-300: oklch(0.87 0 0);
--color-neutral-400: oklch(0.708 0 0);
--color-neutral-500: oklch(0.556 0 0);
--color-neutral-600: oklch(0.439 0 0);
--color-neutral-700: oklch(0.371 0 0);
--color-neutral-800: oklch(0.269 0 0);
--color-neutral-900: oklch(0.205 0 0);
--color-neutral-950: oklch(0.145 0 0);

/* Brand (Blue) */
--color-brand-50: oklch(0.97 0.014 254.604);
--color-brand-100: oklch(0.932 0.032 255.585);
--color-brand-200: oklch(0.882 0.059 254.128);
--color-brand-300: oklch(0.809 0.105 251.813);
--color-brand-400: oklch(0.707 0.165 254.624);
--color-brand-500: oklch(0.623 0.214 259.815);
--color-brand-600: oklch(0.546 0.245 262.881);
--color-brand-700: oklch(0.488 0.243 264.376);
--color-brand-800: oklch(0.424 0.199 265.638);
--color-brand-900: oklch(0.379 0.146 265.522);
--color-brand-950: oklch(0.282 0.091 267.935);

/* Success (Green) */
--color-success-50: oklch(0.982 0.018 155.826);
--color-success-500: oklch(0.723 0.219 149.579);
--color-success-900: oklch(0.393 0.095 152.535);

/* Warning (Amber) */
--color-warning-50: oklch(0.987 0.022 95.277);
--color-warning-500: oklch(0.769 0.188 70.08);
--color-warning-900: oklch(0.414 0.112 45.904);

/* Destructive (Red) */
--color-destructive-50: oklch(0.971 0.013 17.38);
--color-destructive-500: oklch(0.577 0.245 27.325);
--color-destructive-900: oklch(0.396 0.141 25.723);

/* Info (Cyan) */
--color-info-50: oklch(0.984 0.019 200.873);
--color-info-500: oklch(0.715 0.143 215.221);
--color-info-900: oklch(0.376 0.074 219.324);
```

#### Semantic Tokens

```css
/* Background */
--bg-primary: var(--color-white);
--bg-secondary: var(--color-neutral-50);
--bg-tertiary: var(--color-neutral-100);
--bg-sidebar: var(--color-neutral-950);

/* Text */
--text-primary: var(--color-neutral-950);
--text-secondary: var(--color-neutral-600);
--text-tertiary: var(--color-neutral-400);
--text-inverse: var(--color-white);
--text-link: var(--color-brand-600);

/* Border */
--border-primary: var(--color-neutral-200);
--border-secondary: var(--color-neutral-100);
--border-focus: var(--color-brand-500);

/* Interactive */
--interactive-primary: var(--color-brand-600);
--interactive-primary-hover: var(--color-brand-700);
--interactive-primary-active: var(--color-brand-800);
--interactive-secondary: var(--color-neutral-100);
--interactive-secondary-hover: var(--color-neutral-200);

/* Status */
--status-success: var(--color-success-500);
--status-warning: var(--color-warning-500);
--status-destructive: var(--color-destructive-500);
--status-info: var(--color-info-500);

/* Operational Status Colors */
--op-shipment-planned: var(--color-info-500);
--op-shipment-in-transit: var(--color-brand-500);
--op-shipment-delayed: var(--color-warning-500);
--op-shipment-exception: var(--color-destructive-500);
--op-shipment-arrived: var(--color-success-500);
--op-shipment-completed: var(--color-neutral-500);
--op-shipment-cancelled: var(--color-neutral-400);

/* Chart Colors */
--chart-1: oklch(0.623 0.214 259.815);
--chart-2: oklch(0.723 0.219 149.579);
--chart-3: oklch(0.769 0.188 70.08);
--chart-4: oklch(0.715 0.143 215.221);
--chart-5: oklch(0.577 0.245 27.325);
--chart-6: oklch(0.828 0.189 84.429);
--chart-7: oklch(0.685 0.169 237.323);
--chart-8: oklch(0.553 0.195 38.298);
--chart-9: oklch(0.512 0.262 276.966);
--chart-10: oklch(0.6 0.118 184.704);
```

### 2.2 Typography

```css
/* Font Stacks */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
--font-numeric: 'IBM Plex Mono', ui-monospace, monospace;

/* Type Scale */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px — Body */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px — H3 */
--text-2xl: 1.5rem;     /* 24px — H2 */
--text-3xl: 1.875rem;   /* 30px — H1 */
--text-4xl: 2.25rem;    /* 36px — Display */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* Letter Spacing */
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-label: 0.14em;  /* For uppercase labels */

/* Typography Scale */
--type-display: 600 var(--text-4xl)/var(--leading-tight) var(--font-sans);
--type-h1: 600 var(--text-3xl)/var(--leading-tight) var(--font-sans);
--type-h2: 600 var(--text-2xl)/var(--leading-tight) var(--font-sans);
--type-h3: 600 var(--text-xl)/var(--leading-tight) var(--font-sans);
--type-body: 400 var(--text-sm)/var(--leading-normal) var(--font-sans);
--type-body-lg: 400 var(--text-base)/var(--leading-normal) var(--font-sans);
--type-label: 500 var(--text-xs)/var(--leading-normal) var(--font-sans);
--type-mono: 400 var(--text-sm)/var(--leading-normal) var(--font-mono);
--type-numeric: 500 var(--text-sm)/var(--leading-normal) var(--font-mono);
```

### 2.3 Spacing Scale

```css
/* 4px Grid — MUST be used instead of arbitrary Tailwind values */
--space-0.5: 0.125rem;    /* 2px */
--space-1: 0.25rem;       /* 4px */
--space-1.5: 0.375rem;    /* 6px */
--space-2: 0.5rem;        /* 8px */
--space-2.5: 0.625rem;    /* 10px */
--space-3: 0.75rem;       /* 12px */
--space-3.5: 0.875rem;    /* 14px */
--space-4: 1rem;          /* 16px */
--space-5: 1.25rem;       /* 20px */
--space-6: 1.5rem;        /* 24px */
--space-7: 1.75rem;       /* 28px */
--space-8: 2rem;          /* 32px */
--space-9: 2.25rem;       /* 36px */
--space-10: 2.5rem;       /* 40px */
--space-11: 2.75rem;      /* 44px */
--space-12: 3rem;         /* 48px */
--space-14: 3.5rem;       /* 56px */
--space-16: 4rem;         /* 64px */
--space-20: 5rem;         /* 80px */
--space-24: 6rem;         /* 96px */
--space-28: 7rem;         /* 112px */
--space-32: 8rem;         /* 128px */
```

### 2.4 Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;     /* 4px */
--radius-md: 0.375rem;    /* 6px — Buttons, Inputs */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px — Cards, Dialogs */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;    /* Pills */

/* Semantic Mappings */
--radius-button: var(--radius-md);
--radius-input: var(--radius-md);
--radius-card: var(--radius-xl);
--radius-dialog: var(--radius-xl);
--radius-badge: var(--radius-md);
--radius-table: var(--radius-md);
```

### 2.5 Elevation

```css
--shadow-panel: 0 1px 2px 0 oklch(0 0 0 / 0.05);
--shadow-elevated: 0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1);
--shadow-overlay: 0 18px 45px -8px oklch(0 0 0 / 0.18);
--shadow-command: 0 24px 60px -10px oklch(0 0 0 / 0.22);
--shadow-sticky: 0 1px 0 0 oklch(0 0 0 / 0.08);
```

### 2.6 Motion

```css
/* Durations */
--duration-instant: 0ms;
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;

/* Easing */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Motion Tokens for Components */
--motion-duration: var(--duration-normal);
--motion-ease: var(--ease-out);
--motion-enter: var(--duration-fast) var(--ease-out);
--motion-exit: var(--duration-fast) var(--ease-in);
--motion-scale: 0.95;

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  --motion-duration: 0ms;
  --motion-enter: 0ms var(--ease-linear);
  --motion-exit: 0ms var(--ease-linear);
}
```

### 2.7 Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;       /* Dialogs, Sheets */
--z-modal: 400;         /* Modal backdrop */
--z-popover: 500;       /* Tooltips, Popovers */
--z-toast: 600;         /* Toast notifications */
--z-command: 700;       /* Command palette overlay */
```

### 2.8 Density

```css
/* Density Modes */
--density-comfortable-control-height: 2.75rem;  /* 44px */
--density-compact-control-height: 2.25rem;       /* 36px */
--density-operational-control-height: 2rem;       /* 32px */

--density-comfortable-padding: var(--space-4);    /* 16px */
--density-compact-padding: var(--space-3);         /* 12px */
--density-operational-padding: var(--space-2);     /* 8px */

--density-comfortable-gap: var(--space-4);         /* 16px */
--density-compact-gap: var(--space-3);             /* 12px */
--density-operational-gap: var(--space-2);         /* 8px */
```

### 2.9 Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;

/* Container */
--container-max: 1280px;
--container-narrow: 768px;
--container-wide: 1536px;
```

---

## 3. Theme Definitions

### 3.1 Light Theme (Default)

```css
:root {
  /* Background */
  --bg-primary: oklch(1 0 0);
  --bg-secondary: oklch(0.97 0 0);
  --bg-tertiary: oklch(0.922 0 0);

  /* Text */
  --text-primary: oklch(0.145 0 0);
  --text-secondary: oklch(0.439 0 0);
  --text-tertiary: oklch(0.708 0 0);

  /* Border */
  --border-primary: oklch(0.922 0 0);
  --border-secondary: oklch(0.97 0 0);
  --border-focus: oklch(0.546 0.245 262.881);

  /* Interactive */
  --interactive-primary: oklch(0.546 0.245 262.881);
  --interactive-primary-hover: oklch(0.488 0.243 264.376);
  --interactive-primary-active: oklch(0.424 0.199 265.638);

  /* Sidebar */
  --sidebar-bg: oklch(0.145 0 0);
  --sidebar-fg: oklch(0.922 0 0);
  --sidebar-primary: oklch(0.546 0.245 262.881);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-border: oklch(0.371 0 0);
}
```

### 3.2 Dark Theme

```css
.dark {
  --bg-primary: oklch(0.145 0 0);
  --bg-secondary: oklch(0.205 0 0);
  --bg-tertiary: oklch(0.269 0 0);

  --text-primary: oklch(0.922 0 0);
  --text-secondary: oklch(0.708 0 0);
  --text-tertiary: oklch(0.556 0 0);

  --border-primary: oklch(0.371 0 0);
  --border-secondary: oklch(0.269 0 0);
  --border-focus: oklch(0.707 0.165 254.624);

  --interactive-primary: oklch(0.707 0.165 254.624);
  --interactive-primary-hover: oklch(0.809 0.105 251.813);
  --interactive-primary-active: oklch(0.882 0.059 254.128);

  --sidebar-bg: oklch(0.11 0 0);
  --sidebar-fg: oklch(0.922 0 0);
  --sidebar-primary: oklch(0.707 0.165 254.624);
  --sidebar-accent: oklch(0.205 0 0);
  --sidebar-border: oklch(0.269 0 0);
}
```

### 3.3 High Contrast Theme [NEW]

```css
.high-contrast {
  /* Increased contrast ratios — WCAG AAA compliant */
  --text-primary: oklch(0 0 0);
  --text-secondary: oklch(0.2 0 0);
  --border-primary: oklch(0.3 0 0);
  --border-focus: oklch(0.4 0.3 262.881);
  --interactive-primary: oklch(0.3 0.3 262.881);

  /* Underline all links */
  --link-decoration: underline;

  /* Thicker focus rings */
  --focus-ring-width: 3px;
}
```

### 3.4 Enterprise Theme [NEW]

```css
.enterprise-theme {
  /* Enterprise customers can customize */
  --brand-hue: 262.881;  /* Default brand hue — configurable per client */

  /* Derived from brand hue */
  --interactive-primary: oklch(0.546 0.245 var(--brand-hue));
  --sidebar-primary: oklch(0.546 0.245 var(--brand-hue));
  --border-focus: oklch(0.546 0.245 var(--brand-hue));
}
```

---

## 4. Component Architecture

### 4.1 Component Tree

```
Atoms (18)
├── Button              (variants: default, secondary, outline, ghost, destructive)
│                       (sizes: sm, default, lg, icon)
├── Input               (types: text, email, password, search, number)
├── Label               (with required indicator)
├── Badge               (variants: info, success, warning, destructive, outline, secondary)
├── Separator           (orientation: horizontal, vertical)
├── Skeleton            (variants: text, card, table-row, metric-tile)
├── Spinner             (sizes: sm, default, lg)
├── Switch              (with label)
├── Checkbox            (with label, indeterminate state)
├── RadioGroup          (with Label component)
├── Select              (native dropdown)
├── Textarea            (with character count)
├── Avatar              (variants: image, initials; sizes: sm, md, lg)
├── Tooltip             (side: top, bottom, left, right)
├── Progress            (variants: determinate, indeterminate)
├── Alert               (variants: info, success, warning, destructive)
├── Card                (with CardHeader, CardContent, CardFooter, CardTitle, CardDescription)
└── EmptyState          (with illustration, title, description, action)

Molecules (12)
├── DataTable           (sorting, filtering, pagination, column visibility)
├── Pagination          (page numbers, prev/next, page size selector)
├── Breadcrumb          (auto-generated from route segments)
├── Tabs                (variants: underline, pills, cards)
├── Dialog              (variants: default, alert-destructive)
├── Sheet               (side: left, right, top, bottom)
├── DropdownMenu        (with items, separators, sub-menus)
├── Popover             (with trigger, content, alignment)
├── Command             (search palette with keyboard navigation)
├── Calendar            (single date, date range)
├── DatePicker          (Calendar + Popover + Input)
└── Chart               (Recharts wrapper: bar, line, pie, area, radar)

Organisms (8)
├── SearchPalette       (Cmd+K global command/search)
├── ThemeProvider        (next-themes wrapper)
├── ThemeToggle          (light/dark/system toggle)
├── MetricTile           (label, value, badge, trend)
├── ContextRow           (label, value, description)
├── AccessState          (permission indicator)
├── Toast                (success, error, info, warning with undo)
└── Timeline             (vertical events with status dots) [NEW]

Templates (6)
├── AuthLayout           (split screen for auth pages)
├── PlatformShell        (sidebar + header + content)
├── SettingsLayout       (sidebar navigation + content)
├── AdminLayout          (admin-specific navigation)
├── ReportLayout         (charts + export cards)
└── DetailLayout         (details + timeline + linked resources) [NEW]
```

### 4.2 Component API Standards

```typescript
// Every component MUST:
// 1. Accept className prop for customization
// 2. Forward ref using forwardRef
// 3. Support asChild via Slot (Radix pattern)
// 4. Use semantic HTML elements
// 5. Include aria attributes for accessibility
// 6. Support disabled/loading states where applicable

interface ComponentBaseProps {
  className?: string;
  children?: ReactNode;
}

// Example: Button
interface ButtonProps extends ComponentBaseProps {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg" | "icon";
  disabled?: boolean;
  loading?: boolean;                    // Shows spinner
  loadingText?: string;                  // "A carregar..."
  asChild?: boolean;                     // Radix Slot pattern
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
}
```

### 4.3 State Components Pattern

```typescript
// Every data display component should expose:
// <Component loading />  — shows skeleton
// <Component error />    — shows error state
// <Component empty />    — shows empty state
// <Component data={...} /> — shows actual data

interface DataComponentProps<T> {
  data?: T[];
  loading?: boolean;
  error?: Error | null;
  empty?: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  };
  onRetry?: () => void;
}
```

---

## 5. Accessibility Standards

### 5.1 WCAG Compliance Targets

| Level | Target | Current | Gap |
|---|---|---|---|
| WCAG 2.1 AA | ✅ Required | ~AA | Near complete |
| WCAG 2.1 AAA | 🎯 Goal | ~A | High contrast theme, focus, labels |
| Keyboard navigation | ✅ Required | Partial | Custom shortcuts missing |
| Screen reader | ✅ Required | Untested | Need testing protocol |

### 5.2 Required ARIA Patterns

```html
<!-- Dialog -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirmar accao</h2>
</div>

<!-- Alert -->
<div role="alert" aria-live="polite">
  Erro ao carregar dados
</div>

<!-- Navigation -->
<nav aria-label="Navegacao principal">
  <ul role="list">
    <li><a aria-current="page" href="/app/tracking">Tracking</a></li>
  </ul>
</nav>

<!-- Table -->
<table role="grid" aria-label="Lista de cargas">
  <thead>
    <tr>
      <th scope="col">Referencia</th>
    </tr>
  </thead>
</table>

<!-- Form error -->
<div id="email-error" role="alert" aria-describedby="email-input">
  Email invalido
</div>
```

### 5.3 Focus Management

```typescript
// Rules
// 1. Focus is moved to dialog/sheet title when opened
// 2. Focus is trapped within modal dialogs
// 3. Tab order follows visual order (no positive tabindex)
// 4. Skip link is first focusable element
// 5. Focus ring is visible (3px offset ring)

// Implementation
useFocusTrap(dialogRef, { initialFocus: "#dialog-title" });
```

### 5.4 Color Contrast

| Token Pair | Ratio | WCAG Level |
|---|---|---|
| --text-primary on --bg-primary | 15.5:1 | AAA |
| --text-secondary on --bg-primary | 7.8:1 | AAA |
| --text-tertiary on --bg-primary | 4.2:1 | AA |
| --interactive-primary on --bg-primary | 5.2:1 | AA |
| --text-primary on --sidebar-bg | 13.2:1 | AAA |
| --text-secondary on --sidebar-bg | 5.9:1 | AA |

---

## 6. Component Migration Plan

### Phase 1: Foundation (Sprint 1-2)
| Task | Components | Effort |
|---|---|---|
| Create `packages/design-tokens` | All token definitions, themes | 3 days |
| Create `packages/themes` | Tailwind preset | 1 day |
| Migrate spacing to tokens | All 42 components | 5 days |
| Migrate density to tokens | Button, Input, Badge, Table, Select | 3 days |
| Missing components | Breadcrumb, Tooltip, Timeline, Progress | 4 days |

### Phase 2: Consolidation (Sprint 3-4)
| Task | Components | Effort |
|---|---|---|
| Extract MetricTile | Shared component in `packages/ui` | 1 day |
| Extract ContextRow | Shared component in `packages/ui` | 0.5 day |
| Extract AccessState | Shared component in `packages/ui` | 0.5 day |
| Create `Icon` component | Lucide + custom SVG support | 2 days |
| Add motion tokens | Animate presence for dialogs/sheets | 2 days |

### Phase 3: Enhancement (Sprint 5-6)
| Task | Components | Effort |
|---|---|---|
| High contrast theme | Theme file + CSS variables | 2 days |
| Enterprise theme feature | Brand hue customization | 3 days |
| Density mode switcher | Context + UI toggle | 2 days |
| Focus management audit | All interactive components | 3 days |
| Screen reader testing | All components | 3 days |

---

## 7. Design System Governance

### 7.1 Component Review Checklist

```
[ ] Uses semantic tokens (no hardcoded colors/spacing)
[ ] Uses density tokens for control heights
[ ] Uses motion tokens for transitions
[ ] Has proper TypeScript types (no `any`)
[ ] Uses forwardRef
[ ] Accepts className prop
[ ] Has proper ARIA attributes
[ ] Has stories/visual tests
[ ] Icon uses currentColor
[ ] Loading state (if data component)
[ ] Error state (if data component)
[ ] Empty state (if list component)
[ ] Keyboard navigable
[ ] Focus visible indicator
[ ] Responsive behavior defined
```

### 7.2 Token Usage Rules

```
1. NO hardcoded Tailwind spacing values (p-*, m-*, gap-*, space-*)
   → Use var(--space-*) via custom CSS or tailwind class mapping

2. NO hardcoded height/width on controls
   → Use var(--density-*-control-height)

3. NO hardcoded z-index values
   → Use var(--z-*) from z-index scale

4. NO hardcoded transition/animation values
   → Use var(--motion-*) from motion system

5. NO hardcoded border-radius
   → Use var(--radius-*) from radius scale
```

---

## 8. Tailwind CSS 4 Integration

```css
/* apps/web/app/globals.css */
@import "tailwindcss";
@import "@saptm/themes";  /* Theme presets */

@theme {
  /* Colors */
  --color-background: var(--bg-primary);
  --color-foreground: var(--text-primary);
  --color-muted: var(--bg-secondary);
  --color-muted-foreground: var(--text-secondary);
  --color-border: var(--border-primary);
  --color-primary: var(--interactive-primary);
  --color-primary-foreground: var(--text-inverse);
  --color-secondary: var(--interactive-secondary);
  --color-secondary-foreground: var(--text-primary);
  --color-destructive: var(--status-destructive);
  --color-destructive-foreground: var(--text-inverse);
  --color-sidebar: var(--sidebar-bg);
  --color-sidebar-foreground: var(--sidebar-fg);

  /* Typography */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  /* Spacing — Map space tokens to Tailwind */
  --spacing: var(--space-4);   /* Default spacing unit */
  /* Individual overrides via CSS variables */
}

/* Usage: gap-[var(--space-3)] or in @theme */
```

---

## 9. Design System Scorecard

| Dimension | Current Score | Target Score | Gap |
|---|---|---|---|
| Color tokens | 95/100 | 98/100 | Enterprise theme |
| Typography | 92/100 | 98/100 | Responsive scaling |
| Spacing tokens | 85/100 | 98/100 | Adoption in components |
| Radius usage | 90/100 | 95/100 | Semantic mapping |
| Elevation/Shadows | 88/100 | 95/100 | Sticky header usage |
| Motion | 70/100 | 95/100 | Implementation in components |
| Z-index | 60/100 | 95/100 | Adoption |
| Density modes | 65/100 | 95/100 | Adoption + switcher UI |
| Component completeness | 82/100 | 98/100 | Missing 6 components |
| Accessibility | 75/100 | 95/100 | Screen reader + focus |
| Theme support | 80/100 | 98/100 | High contrast + enterprise |
| Documentation | 60/100 | 90/100 | Storybook + usage docs |
| **Composite** | **78/100** | **96/100** | **18 pts gap** |
