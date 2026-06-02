# SAPTM Design Tokens

## Scope

These tokens define the visual contract for the SAPTM enterprise platform before any product screen is implemented.

## Token Sources

- CSS variables live in `packages/ui/src/styles/globals.css`.
- TypeScript token references live in `packages/ui/src/tokens/index.ts`.
- Consumers import shared utilities from `@saptm/ui` or `@saptm/ui/tokens`.

## Color Model

| Family | Purpose |
| --- | --- |
| Semantic | background, foreground, card, popover, primary, secondary, muted, accent, destructive |
| Operational | success, warning, risk, info |
| Data | chart-1 through chart-5 |
| Navigation | sidebar, sidebar-primary, sidebar-accent, sidebar-border |

Raw color utilities are not allowed in product UI. Use semantic classes and CSS variables.

## Density Model

| Density | Use |
| --- | --- |
| comfortable | Default enterprise forms and panels |
| compact | Dense admin and configuration views |
| operational | High-throughput tracking and control-room views |

Density is a layout decision, not a product feature. Components should expose density through variants only after the primitive is approved.

## Typography

- `--font-sans` is the default UI typeface stack.
- `--font-mono` is reserved for identifiers, audit evidence, and technical values.
- `--font-numeric` is reserved for operational metrics and tabular numbers.

## Governance

- New tokens require Design System and Architect approval.
- Component-specific tokens are prohibited unless the semantic token set cannot represent the state.
- Status colors must map to operational meaning, not decoration.
