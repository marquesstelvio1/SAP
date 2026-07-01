# Relatório Final de Auditoria Enterprise — SAPTM

**Data:** 2026-07-01
**Departamentos envolvidos:** 7 (Visual Design, Frontend, QA, Design QA, Architecture, Backend, Database)
**Ficheiros auditados:** ~150
**Ficheiros corrigidos:** ~70+

---

## 1. O QUE FOI FEITO

### 1.1 Correcções de texto (70+ ficheiros)

| Padrão | Ocorrências | Acção |
|--------|-------------|-------|
| `"governado"` | 6 | Removido de toda a UI → linguagem operacional |
| `"Sem permissao"` | 2 | → `"Indisponivel"` |
| `"Bloqueado"` (acesso) | 15 | → `"Indisponivel"` em badges de permissão |
| `"tenant"` (UI) | 8 | → `"organizacao"` |
| `"service account"` | 8 | → `"conta de servico"` |
| Permission names em badges | 27 | → rótulos operacionais PT-PT |
| `"audit trail"` / `"outbox"` (descrições) | 40+ | → `"registo de auditoria"` |
| `"transport order"` | 6 | → `"ordem de transporte"` |
| `"RBAC"` / `"tenant-scoped"` | 5 | → linguagem operacional |

### 1.2 Melhorias estruturais

- **Sidebar**: navegação flat, permission filtering, icon mapping fixo, two-div pattern
- **Dashboard**: navegação dinâmica via `resolvePlatformNavigation()` em vez de links manuais
- **render.yaml**: corrigido para Render Blueprint spec

---

## 2. AUDITORIAS REALIZADAS

| Fase | Departamento | Status | Score |
|------|-------------|--------|-------|
| Fase 1 — Foundation | Visual Design | ✅ | 4/5 (base sólida, tracking tokens inconsistentes) |
| Fase 1 — Foundation | Frontend | ✅ | 8 findings (2 🔴, 6 🟡) |
| Fase 2 — Core pages | Frontend | ✅ | 54% (admin/audit com texto developer-face) |
| Fase 3 — Operational | Frontend | ✅ | Notifications pior caso (worker exposto) |
| Fase 4 — Settings | Frontend | ✅ | Privacy usa LGPD brasileira em vez de RGPD |
| Fase 5 — Auth/Public | Frontend | ✅ | 18 issues (Better Auth, RBAC, shell expostos) |
| Fase 6 — QA | QA | ✅ | 10/15 domínios RPC com testes |
| Fase 6 — Design QA | Design QA | ✅ | **REJEITADO** — 2 Major issues |

---

## 3. DESIGN QA — VEREDICTO FINAL

**Resultado: REJEITADO** (not yet delivery-ready)

### Blocker (0)
Nenhum — acessibilidade OK, contraste OKLCH válido, identidade visual respeitada.

### Major (2)

1. **`packages/ui/src/components/data-table.tsx`** — 12 strings EN visíveis (`"Filter..."`, `"Columns"`, `"Rows per page"`, etc.)
2. **`packages/ui/src/components/` (spinner, pagination, search-palette, theme-toggle, sidebar)** — 11 strings EN em aria-labels e texto visível

### Minor (23)
- 9 acentos PT-PT em falta (`"Gestao"`, `"nao"`, `"Modulos"`)
- `error-card.tsx` sem `role="alert"`
- 2 páginas sem try/catch em server components
- Tracking tokens não documentados no DESIGN-SYSTEM.md

---

## 4. GAPS CRÍTICOS NÃO CORRIGIDOS

### 🔴 Prioridade Alta

| # | Issue | Ficheiro | Risco |
|---|-------|----------|-------|
| 1 | EN strings no design system | `data-table.tsx`, `pagination.tsx`, `spinner.tsx`, etc. | UI inconsistente EN/PT |
| 2 | Acentos PT-PT em falta | `page.tsx`, `cargo/page.tsx`, `audit/page.tsx` | Profissionalismo |
| 3 | `requirePlatformSession` sem try/catch | `page.tsx:33`, `cargo/page.tsx:38` | Server crash |
| 4 | `role.key` e `permission` expostos em admin | `admin-roles-tables.tsx`, `admin-users-table.tsx` | Permission names na UI |
| 5 | "Better Auth", "RBAC", "shell" expostos | `sign-in/page.tsx`, `sign-in-form.tsx` | Developer-facing na auth |

### 🟡 Média

| # | Issue | Detalhe |
|---|-------|---------|
| 6 | `membershipId` exposto | `invitation-accept-form.tsx:99-102` |
| 7 | `organization.slug` + `organization.id` expostos | `admin-overview-header.tsx:60-68` |
| 8 | `correlationId` exposto | `audit/page.tsx:340` |
| 9 | `user.id` exposto | `admin-users-table.tsx:97` |
| 10 | Skip link `#main-content` não existe | Todas as páginas públicas |
| 11 | `error.message` exposto | 5 error.tsx públicos |
| 12 | 5 domínios RPC sem testes | billing, privacy, settings, teams, webhooks |
| 13 | Load tests sem autenticação | cargo/tracking cenários |
| 14 | Privacidade cita LGPD brasileira (Lei 13.709/2018) | Deveria ser RGPD (Lei 58/2019) |

### 🟢 Baixa

| # | Issue | Detalhe |
|---|-------|---------|
| 15 | `<fieldset className="contents">` quebra acessibilidade | `audit/page.tsx:176` |
| 16 | `TooltipProvider` duplicado por iteração | `operational-journey-panel.tsx:145` |
| 17 | "Pricing" → "Tarifário" | `tariff-overview-header.tsx:35` |
| 18 | "P13" exposto | `integration-overview-header.tsx:39` |
| 19 | Cobertura de testes: 0% em apps/web | Sem testes unitários frontend |
| 20 | Script de test hardcoded (não glob) | `apps/api`, `packages/rpc` |

---

## 5. RECOMENDAÇÕES PRIORITÁRIAS

### P0 — Antes da próxima entrega
1. Traduzir `data-table.tsx` + `pagination.tsx` + `spinner.tsx` + `search-palette.tsx` (23 strings EN)
2. Corrigir acentos em dashboard, cargo, audit pages
3. Adicionar try/catch nas server pages
4. Remover permission names do admin (role.key → role.name)

### P1 — Próximo sprint
5. Remover `membershipId`, `organization.id`, `correlationId`, `user.id` da UI
6. Adicionar `id="main-content"` nas páginas públicas
7. Substituir `error.message` por mensagem genérica
8. Corrigir LGPD → RGPD na página de privacidade
9. Adicionar `role="alert"` ao `ErrorCard`
10. Criar testes para os 5 domínios RPC órfãos

### P2 — Backlog
11. Auditar e remover "audit trail" / "outbox" restantes
12. Corrigir load tests com autenticação
13. Adicionar testes unitários ao apps/web
14. Converter script de test para glob

---

## 6. SCORECARD FINAL

| Categoria | Score |
|-----------|-------|
| Design tokens / CSS | ⭐⭐⭐⭐ (4/5) |
| PT-PT compliance (UI) | ⭐⭐ (2/5) — 23 EN strings no design system |
| PT-PT compliance (pages) | ⭐⭐⭐⭐ (4/5) — ~9 acentos em falta |
| Acessibilidade | ⭐⭐⭐⭐ (4/5) — 2 issues (fieldset, role alert) |
| Error/Loading/Empty states | ⭐⭐⭐ (3/5) — try/catch em falta, error.message exposto |
| Segurança (exposição de IDs) | ⭐⭐⭐ (3/5) — 4 IDs expostos |
| Cobertura de testes | ⭐⭐⭐ (3/5) — 5 domínios sem testes |
| **Geral** | **⭐⭐⭐ (3.2/5)** |

---

*Auditoria concluída por 7 departamentos. 20 gaps identificados (5 🔴, 9 🟡, 6 🟢).*
*Para executar correcções, invocar @enterprise-frontend, @enterprise-backend, @enterprise-qa.*
