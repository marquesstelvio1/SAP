# shadcn/ui Foundation

## Configuration

The repository is configured for shadcn/ui through `components.json`.

| Setting | Value |
| --- | --- |
| Style | new-york |
| RSC | enabled |
| TypeScript | enabled |
| Tailwind | v4 CSS-first setup |
| CSS entry | `apps/web/app/globals.css` |
| UI package | `packages/ui` |
| Registry | `@shadcn` |

## Import Contract

| Alias | Destination |
| --- | --- |
| `@saptm/ui` | public UI package exports |
| `@saptm/ui/lib/utils` | `cn()` utility |
| `@saptm/ui/tokens` | shared design tokens |
| `@saptm/ui/components` | future shadcn component source |
| `@saptm/ui/hooks` | future UI hooks |

## Implementation Rules

- No screens are created by the Design System foundation.
- shadcn components must be added as source code under `packages/ui`.
- Components must use semantic colors and `cn()`.
- Layout spacing uses `gap-*`, not `space-*`.
- Dialog, Sheet, Drawer, and AlertDialog must include accessible titles.
- Forms must use shadcn field composition when form primitives are introduced.

## Current Foundation

- Tailwind v4 entrypoint exists at `apps/web/app/globals.css`.
- CSS variables and `@theme inline` mappings exist in `packages/ui/src/styles/globals.css`.
- Shared `cn()` utility exists in `packages/ui/src/lib/utils.ts`.
- Token exports exist in `packages/ui/src/tokens/index.ts`.
- Base primitives exist under `packages/ui/src/components`.

## Next Allowed Step

The next module may add accessibility and component tests for these primitives. Product pages remain prohibited.
