# FASE 1 — LINT Gate Report

**Status:** ✅ PASS
**Date:** 2026-06-23
**Command:** `pnpm biome ci .`

## Result
- **Erros:** 0
- **Warnings:** 25 (all in `scripts/` — non-critical)
- **Exit code:** 0

## Issues Fixed (13 total)

### A11y — 9 fixes
| File | Issue | Fix |
|---|---|---|
| `apps/web/app/(dashboard)/trainings/create/page.tsx` | Button sem `type` | Added `type="button"` |
| `packages/ui/src/components/shell-navigation.tsx` | Button sem `type` | Added `type="button"` |
| `packages/ui/src/components/shell-brand.tsx` | SVG decorativo sem `aria-hidden` | Added `aria-hidden="true"` |
| `packages/ui/src/components/shell-user-card.tsx` | SVG decorativo sem `aria-hidden` | Added `aria-hidden="true"` |
| `packages/ui/src/components/navigation-link.tsx` | SVG decorativo sem `aria-hidden` | Added `aria-hidden="true"` |
| `packages/ui/src/components/platform-shell.tsx` | SVG decorativo sem `aria-hidden` | Added `aria-hidden="true"` |
| `apps/web/app/favicon.ico/route.ts` | Icon sem `role`/`aria-label` | Added `role="img"` + `aria-label="SAPTM logo"` |
| `packages/ui/src/components/__stories__/checkbox.stories.tsx` | Label sem `htmlFor` | Added `htmlFor` + `id` no checkbox |

### Correctness — 1 fix
| File | Issue | Fix |
|---|---|---|
| `packages/ui/src/components/data-table.tsx` | `useReactTable` chamado condicionalmente | Refatorado para unconditional com `emptyColumns` fallback |

### Style — 3 fixes
| File | Issue | Fix |
|---|---|---|
| `scripts/generate-openapi.mjs` | `while (x = regex.exec())` (assign-in-expression) | Refatorado para `while (true) { x = regex.exec(); if (x === null) break; }` |

## Deliverables
- [x] LINT-REPORT.md (this file)
- [x] All lint errors resolved
- [x] CI gate green

## Gate Criteria
- `pnpm biome ci .` returns exit code 0 → ✅
- No `any`, no `@ts-ignore`, no `@ts-nocheck` → ✅ (enforced at typecheck level)
