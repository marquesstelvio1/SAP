# SAPTM Base UI Primitives

## Scope

This module adds shadcn-compatible primitives only. It does not add product screens, dashboards, CRUDs, or logistics workflows.

## Components

| Primitive | Purpose |
| --- | --- |
| Button | Action trigger with semantic variants |
| Badge | Compact status and metadata indicator |
| Card | Structured content container |
| Input | Base text input |
| Label | Accessible input label |
| Field | Form composition primitives |
| Separator | Semantic visual separator |
| Skeleton | Loading placeholder |
| Dialog | Modal overlay primitive |
| Sheet | Side panel overlay primitive |
| Table | Semantic data table primitive |

## Import Contract

- Aggregate imports: `@saptm/ui` or `@saptm/ui/components`.
- Direct imports: `@saptm/ui/components/button`, `@saptm/ui/components/table`, etc.
- Utilities: `@saptm/ui/lib/utils`.
- Tokens: `@saptm/ui/tokens`.

## Rules

- Components use semantic tokens only.
- Status variants map to operational meaning.
- Icons inside buttons and badges use `data-icon`.
- Forms use `FieldGroup`, `Field`, `FieldLabel`, and `FieldDescription`.
- Dialog and Sheet content must include visible or screen-reader-only titles.
- Product-specific variants are prohibited until the first approved feature module.
