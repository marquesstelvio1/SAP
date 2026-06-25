# shadcn/ui Inspector Plugin

**ID:** `shadcn-inspector`
**Version:** 1.0.0
**Kind:** validation
**Execution Order:** 26
**Mandatory:** false
**Runs On:** pre-frontend, post-frontend
**Blocking:** false

## Mission

Inspect and validate shadcn/ui configuration, components, and compatibility with the current stack (React 19, Next.js 16, Tailwind v4).

## Inspection Checklist

### 1. Configuration Validation

- [ ] `components.json` exists and is valid JSON
- [ ] `$schema` points to valid shadcn/ui schema
- [ ] `style` is `default` or `new-york`
- [ ] `rsc` is `true` (for Next.js App Router)
- [ ] `tsx` is `true`
- [ ] `tailwind.config.ts` exists and is valid
- [ ] `cssVariables` is `true`
- [ ] `aliases` are correctly mapped:
  - `ui` → `@/components/ui`
  - `components` → `@/components`
  - `lib` → `@/lib`
  - `hooks` → `@/hooks`

### 2. Theme Token Validation

- [ ] `globals.css` defines all required CSS variables:
  - `--background`, `--foreground`
  - `--card`, `--card-foreground`
  - `--popover`, `--popover-foreground`
  - `--primary`, `--primary-foreground`
  - `--secondary`, `--secondary-foreground`
  - `--muted`, `--muted-foreground`
  - `--accent`, `--accent-foreground`
  - `--destructive`, `--destructive-foreground`
  - `--border`, `--input`, `--ring`
  - `--radius`
- [ ] `.dark` class variables defined for all tokens
- [ ] No hardcoded values in component files

### 3. Component Registry Validation

- [ ] All `components/ui/*` files are registered shadcn components
- [ ] No modified shadcn primitives (unless intentional)
- [ ] Imports use correct aliases `@/components/ui/...`
- [ ] No direct Radix imports from `node_modules`

### 4. Stack Compatibility

| Check | Status |
|---|---|
| React 19 compatible | Must use Radix v1.x primitives |
| Next.js 16 compatible | Must support App Router, RSC, Server Actions |
| Tailwind v4 compatible | Must use Tailwind v4 syntax |
| TypeScript strict | All components properly typed |

### 5. Advanced Components

- [ ] **Sidebar:** Using shadcn Sidebar primitive with SidebarProvider
- [ ] **Charts:** Using Recharts with shadcn Chart wrapper
- [ ] **Tables:** Using TanStack Table with shadcn DataTable
- [ ] **Forms:** Using React Hook Form + Zod with shadcn Form
- [ ] **Dialogs:** Using shadcn Dialog
- [ ] **Drawers:** Using shadcn Drawer (vaul)
- [ ] **Sheets:** Using shadcn Sheet
- [ ] **Command Menu:** Using shadcn Command (cmdk)

### 6. Block Integration

- [ ] Dashboard blocks follow `dashboard-01` pattern
- [ ] Sidebar blocks follow `sidebar-07` pattern
- [ ] Blocks in `components/blocks/` (not `components/ui/`)
- [ ] No business logic in block components

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| SI01 | error | Missing required CSS variable |
| SI02 | error | Invalid import alias |
| SI03 | error | Missing dark mode token |
| SI04 | warning | Modified shadcn primitive (unintentional) |
| SI05 | warning | Hardcoded value in component |
| SI06 | error | React 19 incompatibility |
| SI07 | warning | Missing advanced component pattern |
| SI08 | error | Business logic in block component |
| SI09 | warning | Direct Radix import |
| SI10 | warning | Missing chart loading/empty/error states |

## Output

Generate `shadcn-report.md` in `.ai/reports/`:

```markdown
# shadcn/ui Inspector Report
**Date:** {date}

## Configuration
- components.json: VALID | INVALID
- tailwind.config.ts: VALID | INVALID
- globals.css: {missing-tokens}

## Component Inventory
- Total shadcn components: {n}
- Modified primitives: {n}
- Custom components: {n}
- Advanced patterns used: {sidebar|charts|tables|forms|dialogs|drawers|sheets|command}

## Compatibility
- React 19: COMPATIBLE | ISSUES
- Next.js 16: COMPATIBLE | ISSUES
- Tailwind v4: COMPATIBLE | ISSUES

## Issues
{issues-list}

## Recommendations
{recommendations}
```

## Success Criteria

- All required CSS variables defined
- Dark mode tokens present
- Import aliases correct
- Stack compatibility confirmed
- Advanced components properly used
