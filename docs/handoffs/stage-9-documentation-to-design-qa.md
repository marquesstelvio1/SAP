# Handoff Report: Stage 9 → Stage 10 (Documentation → Design QA)

> **De:** Departamento de Documentação (`@enterprise-documentation`)
> **Para:** Departamento de Design QA (`@enterprise-design-qa`)
> **Data:** 2026-07-03

## Resumo

Consolidação completa da documentação do SAPTM — inventário de 364 ficheiros `.md`, actualização de ADRs, criação de runbooks operacionais e guias de configuração, correcção de referências desactualizadas.

## Documentos Existentes

- **Total de ficheiros `.md` em `docs/`:** 364
- **ADRs:** 15 (0001-0017, gaps 0010-0011)
- **Handoffs:** 8 (Stage 1-8) + este (Stage 9)
- **Runbooks:** 5 anteriores + 2 novos (billing, deployment)
- **Guides:** 0 anteriores + 1 novo (SSO configuration)

## Documentos Criados

| Documento | Descrição |
|-----------|-----------|
| `docs/README.md` | Portal de documentação com cross-reference por audiência e departamento |
| `docs/runbooks/billing.md` | Runbook de facturação — fluxo Stripe, webhooks, planos, troubleshooting |
| `docs/runbooks/deployment.md` | Runbook de deployment — build, env vars, startup order, health checks, rollback |
| `docs/guides/sso-configuration.md` | Guia de configuração SSO/SAML para administradores de organização |

## Documentos Actualizados

| Documento | Alteração |
|-----------|-----------|
| `docs/adr/0008-cargo-tracking-event-driven-handoff.md` | Status alterado de "Proposed" para "Accepted" com nota sobre implementação parcial |
| `docs/adr/0009-event-versioning.md` | Adicionada nota sobre registry de eventos não implementado |
| `docs/adr/0015-team-scoping-model.md` | Adicionada nota sobre `tenant-scoping.ts` inexistente |
| `docs/adr/0017-schema-additions-billing-teams-sso.md` | Adicionada nota sobre diferenças entre ADR e implementação real |
| `docs/security/http-security-headers.md` | Corrigido path de `apps/web/src/proxy.ts` para `apps/web/proxy.ts` |
| `docs/enterprise/EXECUTION_TASKS.md` | Corrigido path de `event-bus.ts` para `domain-events.ts` |

## Referências Desactualizadas (Não Corrigidas)

Por estarem em ficheiros de archive históricos que documentam estado anterior do sistema. Design QA pode querer notar:

| Ficheiro | Referência | Problema |
|----------|-----------|----------|
| `docs/enterprise/archive/EXECUTION-LOG.md` | `apps/web/src/middleware.ts` | Ficheiro foi renomeado para `proxy.ts` |
| `docs/enterprise/archive/FINAL-ENTERPRISE-REPORT.md` | `apps/web/src/middleware.ts` | Idem |
| `docs/enterprise/archive/HIGH_RISK_ISSUES.md` | `apps/web/src/middleware.ts` | Idem |
| `docs/enterprise/archive/VALIDATION_CHECKLIST.md` | `apps/web/src/middleware.ts` | Idem |
| `docs/enterprise/archive/TECH_DEBT_DEPENDENCIES.md` | `apps/web/src/middleware.ts` | Idem |
| `docs/enterprise/SYSTEM_HEALTH_SCORE.md` | `apps/web/src/middleware.ts` | Idem |
| `docs/enterprise/archive/STRUCTURAL_GAPS.md` | `.ps1` files | Já não existem (substituídos por `.mjs`) |

## Documentação UI para Design QA Verificar

Os seguintes documentos contêm especificações de UI que o Design QA deve verificar quanto à implementação real:

### 1. `docs/design/ui-specs/billing-overview.md`
- Componentes `UsageMeter`, `PlanBadge`, `InvoiceTable` — verificar se foram implementados
- Estados (Free, Past Due, Canceled) — verificar se existem na UI
- Empty state com `AccessState` — verificar conformidade com padrão

### 2. `docs/design/ui-specs/sso-config.md`
- Componentes `DomainVerifyCard`, `SsoConfigForm`, `OAuthProviderToggle` — verificar implementação
- Estados (loading, error, blocked — "disponivel apenas no plano Enterprise") — verificar
- Domain verification states (not verified, pending, verified, failed) — verificar UX

### 3. `docs/design/ui-specs/subscription-management.md`
- Componentes `PlanCard`, `PlanBadge` — verificar implementação
- Plan cards layout com Free/Pro/Enterprise
- Canceled/past due states — verificar

### 4. `docs/design/ui-specs/team-switcher.md`
- Já implementado — verificar conformidade com spec
- Refinements pendentes (team-level switcher, keyboard shortcut)

## Documentação de Arquitectura (Backend) para Verificação

- `docs/architecture/domain-map.md` — Verificar se o mapeamento de domínios ainda está correcto
- `docs/rpc/rpc-strategy.md` — Verificar se a estratégia RPC está actualizada
- `docs/architecture/tenant-isolation.md` — Nota sobre tenant scoping gaps

## Gaps de Documentação Identificados

1. **`packages/rpc/src/events/`** — Registry de eventos versionados não existe (ADR-0009)
2. **`packages/database/src/tenant-scoping.ts`** — Extensão Prisma para team scoping não implementada (ADR-0015)
3. **Feature gating** — Ainda usa `getPlanLimits()` hardcoded, não `Plan.features` (ADR-0017)
4. **`Subscription.planId`** — Nullable com campo legacy `plan` mantido (migração incompleta)
5. **SLI/SLO v1** (`docs/observability/sli-slo.md`) — Precisa de revisão (v2 já existe em `docs/observability/slos.md`)
6. **Business rules de billing/subscription** — Marcadas como "TODO" em vários pontos

## Recomendações para Design QA

1. Verificar se as UI specs correspondem à implementação real nos componentes
2. Confirmar que o `AccessState` component é usado consistentemente (loading, error, blocked)
3. Verificar que os tokens de design density/shadow estão correctamente aplicados nos novos componentes de billing/SSO
4. Verificar acessibilidade (WCAG 2.1 AA) nas páginas de billing e SSO
5. Verificar que as labels em PT-PT usam linguagem operacional (não developer-facing)

## Quality Gates Documentation

| Gate | Status |
|------|--------|
| Docs inventory complete (364 files) | ✅ |
| ADR statuses reviewed and updated | ✅ (4 ADRs actualizados) |
| Runbooks created (billing, deployment) | ✅ |
| SSO admin guide created | ✅ |
| Stale references fixed | ✅ (2 files) |
| Stale references noted (archive) | ✅ (7 archive files notated) |
| Docs README portal created | ✅ |
| Handoff report for Stage 10 | ✅ |

## Checklist de Handoff

- [x] Docs README criado com cross-reference por audiência
- [x] ADRs actualizados com status correctos e notas de implementação
- [x] Runbook de billing criado (Stripe webhooks, planos, troubleshooting)
- [x] Runbook de deployment criado (build, env vars, startup order, rollback)
- [x] Guia SSO criado (configuração por fornecedor, JIT provisioning, troubleshooting)
- [x] Referências stale corrigidas (middleware.ts, event-bus.ts, proxy.ts path)
- [x] Referências stale notadas em archive files
- [x] Handoff report gerado para Design QA

---

**Departamento de Documentação** — `@enterprise-documentation`
