# Standard: shadcn/ui

**Phase:** 4 — Engineering Standards

---

## Required

- New York style (`"style": "new-york"`)
- Components added via `npx shadcn add [component]`
- CVA (`class-variance-authority`) for component variants
- `tailwind-merge` (`cn()` utility) for class merging
- Design tokens from `@saptm/ui/tokens` for all colors/spacing
- Dark mode support for all components
- Responsive design for all breakpoints

## Component Structure

```
@Component.tsx          # Component implementation
@Component.stories.tsx  # Storybook stories
@Component.test.tsx     # Structural rendering tests
index.ts                # Re-export
```

## Recommended

- Use Radix UI primitives for complex interactive components
- Use lucide-react icons
- Use sonner for toast notifications
- Use TanStack Table for data tables
- Use react-hook-form for forms
- Use react-day-picker for date inputs

## Forbidden

- Hardcoded color values (use design tokens)
- Hardcoded spacing values (use `space-*` tokens)
- Inline styles for layout/styling
- Duplicating component implementations
- Styling without dark mode consideration
- Direct DOM manipulation

## Design Tokens

```
Colors:    --primary, --muted, --destructive, --accent, etc.
Spacing:   --space-{0-32}
Shadows:   --shadow-{panel, overlay, command, sticky}
Density:   comfortable (default), compact, operational
```

## Validation

- Component renders without errors
- Dark mode toggles correctly
- Keyboard navigation works
- Screen reader announces correctly
- Storybook stories render all variants

## Migration

- When upgrading shadcn components, review diff before applying
- Test all component variants after upgrade
- Verify dark mode in all components
