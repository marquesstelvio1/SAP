# SAPTM — Executive Code Audit

> Orquestrado pelo Enterprise Executive Office  
> Data: 2026-06-29  
> Metodologia: Análise estática de código, execução de lint/typecheck/tests, revisão de segurança, arquitetura e DevOps.

---

## 1. Resumo Executivo

A plataforma SAPTM apresenta uma base arquitetural sólida e enterprise-grade em várias frentes: monorepo bem estruturado, contratos RPC com metadados ricos, autenticação robusta (Better Auth + 2FA), auditoria, outbox, RBAC e observabilidade. Contudo, a auditoria identificou **gaps críticos de segurança, qualidade e governança** que devem ser endereçados antes de qualquer expansão de funcionalidades ou promoção a produção.

| Dimensão | Estado | Nota |
|---|---|---|
| Arquitetura | 🟡 Boa, com gaps de governança | 78/100 |
| Backend | 🟡 Sólido, mas com violações de regras | 76/100 |
| Frontend | 🟡 Estrutura correta (proxy.ts), mas CSP nonce não consumido | 72/100 |
| Base de Dados | 🟡 Boa modelação, mas com riscos de deleção | 75/100 |
| Segurança | 🔴 Gaps críticos (CSRF secrets, hard deletes, CSP eficácia) | 68/100 |
| QA / Testes | 🔴 UI tests falham, sem cobertura | 58/100 |
| DevOps | 🟡 Bom, com fragilidades | 76/100 |
| Performance | 🟡 Razoável, oportunidades de otimização | 72/100 |
| Documentação | 🟡 Desatualizada/inconsistente | 68/100 |
| **NOTA GLOBAL** | **🟡 Condicional — exige correções antes de produção** | **72/100** |

---

## 2. Findings Críticos

### 2.1 Segurança — CSP nonce não é consumido no layout (Next.js 16 proxy)

**Severidade: ALTA**

- `apps/web/src/proxy.ts` está correto para Next.js 16: a convenção `middleware.ts` foi renomeada para `proxy.ts` e a função exportada deve chamar-se `proxy`. A localização `src/proxy.ts` é válida segundo a regex `(?:src/)?proxy`.
- No entanto, o **nonce gerado no proxy não é propagado aos elementos `<script>` e `<style>`** em `apps/web/app/layout.tsx`. O CSP define `script-src 'self' 'nonce-${nonce}'` e `style-src 'self' 'nonce-${nonce}'`, mas sem injetar o nonce nos recursos inline, a política pode bloquear scripts/styles legítimos ou ser ineficaz contra XSS.
- A documentação (`AGENTS.md`, `CURRENT_STATE.md`) ainda refere `apps/web/src/middleware.ts`, o que está desatualizado para Next.js 16.

**Ficheiros afetados:**
- `apps/web/src/proxy.ts` (gera nonce, define headers)
- `apps/web/app/layout.tsx` (não consome `x-nonce`)

**Recomendação:**
1. Ler o header `x-nonce` no layout (via headers do Next.js) e aplicá-lo a `<script>` e `<style>` inline.
2. Verificar se Next.js está a propagar o nonce automaticamente aos seus scripts internos; se não, configurar explicitamente.
3. Atualizar `AGENTS.md` e `CURRENT_STATE.md` para refletir a convenção `proxy.ts` do Next.js 16.

---

### 2.2 Segurança — `BETTER_AUTH_SECRET` usado como fallback do CSRF

**Severidade: CRÍTICA**

- `apps/api/src/security/csrf.middleware.ts:31-32` usa `env.BETTER_AUTH_SECRET` como fallback do session identifier quando não existe cookie de sessão.
- Isto significa que pedidos não autenticados (ou com cookie expirado) partilham o mesmo secret CSRF, potencialmente permitindo token fixation ou previsibilidade.

**Recomendação:**
- Usar um secret CSRF dedicado (ex: `CSRF_SECRET`) independente do `BETTER_AUTH_SECRET`.
- Para sessões anónimas, gerar identificador aleatório por request ou usar token CSRF stateless seguro.

---

### 2.3 Segurança — Bypass de CSRF por header interno

**Severidade: ALTA**

- O header `x-internal-request: true` faz bypass total do CSRF (`csrf.middleware.ts:63-66`).
- O comentário assume que CORS impede browsers de definirem este header, mas:
  - Se houver XSS, o atacante pode injetar código que define o header via fetch com `mode: no-cors`? Não — `mode: no-cors` ainda impede headers customizados.
  - No entanto, qualquer compromise do frontend (XSS) ou de um proxy interno pode explorar este bypass.
- Além disso, `apps/web/lib/rpc-client.ts:98-100` envia o header em **todos** os pedidos server-side, incluindo Server Actions — o que é correto, mas deve ser acompanhado de auditoria estrita.

**Recomendação:**
- Considerar validação adicional do origin/IP para pedidos com `x-internal-request`.
- Documentar threat model deste bypass.

---

### 2.4 Base de Dados — Hard deletes em dados de domínio

**Severidade: ALTA**

Apesar da regra "No hard deletes on domain data — use status lifecycle", encontraram-se deletes reais em entidades de domínio:

- `apps/api/src/cargo/infrastructure/prisma-cargo.repository.ts:719` — `cargo.delete`
- `apps/api/src/admin/infrastructure/prisma-admin.repository.ts:399` — `role.delete`
- `apps/api/src/admin/infrastructure/prisma-admin.repository.ts:407-429` — `membershipRole.delete`, `membershipRole.deleteMany`, `rolePermission.deleteMany`
- `apps/api/src/webhooks/infrastructure/prisma-webhooks.repository.ts:41` — `webhookEndpoint.delete`
- `apps/api/src/teams/infrastructure/prisma-teams.repository.ts:130` — `team.delete`
- `apps/api/src/teams/infrastructure/prisma-teams.repository.ts:155` — `teamMember.delete`

**Recomendação:**
- Converter deletes de domínio em transições de estado (`status: archived | cancelled | removed`) ou soft-delete implementado (`packages/database/src/soft-delete.ts`).
- Permitir hard delete apenas em tabelas de junção/relacionamento quando a entidade principal sofre soft-delete.

---

### 2.5 QA — Testes de UI falham

**Severidade: ALTA**

A execução de `pnpm test` falha em `@saptm/ui`:

- `button.test.mjs:97` espera `style.height === "var(--space-9)"` para botão default, mas apenas `size: "icon"` define `height` em `sizeStyles`.
- `metric-tile.test.mjs:59/71` espera classes `text-emerald-600` / `text-red-600`, mas o componente usa `text-success` / `text-destructive`.
- `sidebar.test.mjs` falha por timeout/erro não detalhado.

**Recomendação:**
- Corrigir os testes para refletir a implementação atual ou ajustar o componente.
- Gerar `dist/` fresco antes de correr testes (testes importam de `dist/`).

---

### 2.6 Qualidade — Uso de `any` e `console.error`

**Severidade: MÉDIA**

O projeto proíbe explicitamente `any` (`AGENTS.md`: "No `any` — use `unknown` with guards"), mas encontraram-se:

- `apps/api/src/rate-limit/rate-limit.module.ts:32` — `(req as any).authContext`
- `apps/api/src/rate-limit/tenant-throttler.guard.ts:7,15` — `(req as any).authContext`
- `packages/form/src/zod-resolver.ts:42` — `z.ZodType<any, any, any>` (com biome-ignore, mas ainda viola a regra de projeto)

`console.error` em vez do logger estruturado:

- `apps/api/src/event-bus/event-bus.service.ts:21,28,40,47`
- `apps/api/src/webhooks/webhook-delivery.worker.ts:26`
- `apps/api/src/health/health.service.ts:124`
- `apps/api/src/observability/opentelemetry.ts:28`

**Recomendação:**
- Substituir `as any` por tipagem via `AuthContextRequest` ou similar.
- Usar o logger de observabilidade em todos os pontos críticos.

---

## 3. Findings por Departamento

### 3.1 Arquitetura

**Pontos Positivos:**
- Monorepo coerente com 2 apps e 11 packages (nota: `CURRENT_STATE.md` refere 10 packages, omitindo `@saptm/form`).
- Regras de dependência respeitadas: apps → packages, packages → packages.
- Contratos RPC em `packages/rpc/src/` com metadados completos: name, version, kind, auth, permissions, audit, idempotency, criticality.
- Validação em `metadata.ts` proíbe permissões em operações públicas e exige auth explícito em mutações.
- Padrão Controller → Service → Repository visível na maioria dos domínios.

**Gaps:**
- **ADRs / C4**: não foram encontrados modelos C4 ou ADRs estruturados em `docs/` ou `.ai/`.
- **Inconsistência documental**: `CURRENT_STATE.md` lista 10 packages; `AGENTS.md` lista 11. `CURRENT_STATE.md` afirma "No Sentry", mas existe `@sentry/nextjs` e configuração ativa. Ambos os documentos ainda referem `apps/web/src/middleware.ts`, mas o projeto usa corretamente a convenção `src/proxy.ts` do Next.js 16.
- **Páginas do web em `app/` e não `src/app/`**: `CURRENT_STATE.md` e `AGENTS.md` parecem desatualizados quanto à estrutura real do Next.js.

### 3.2 Backend

**Pontos Positivos:**
- NestJS 11 bem modularizado com 22 módulos.
- Global guards (AuthorizationGuard, ThrottlerGuard), interceptor de observabilidade e filtro RPC.
- Tenant scoping via Prisma Client Extension em `packages/database/src/tenant-scoping.ts`.
- Outbox pattern com `OutboxEvent` e worker.
- Idempotency keys em múltiplos modelos de domínio (Cargo, Tracking, etc.).
- Account lockout e login attempts implementados.

**Gaps:**
- **Hard deletes em domínio** (secção 2.4).
- **`as any` em rate-limit** (secção 2.6).
- **Falta de logger estruturado** em event-bus, webhooks, health (secção 2.6).
- **Team não está no `TENANT_SCOPED_MODELS`** porque usa `orgId` em vez de `organizationId`. O risco é que queries a `Team`/`TeamMember` não sejam automaticamente scoped e dependam exclusivamente do repositório.
- **Rate limiting**: documentação refere 3 tiers (api 200/min, org 1000/min, user 100/min), mas o `main.ts` não aplica explicitamente o `TenantThrottlerGuard` como global guard. Verificar se está wired no `RateLimitModule`.

### 3.3 Frontend

**Pontos Positivos:**
- Next.js 16 App Router, standalone output.
- Server Components por default (`page.tsx` são RSC).
- shadcn/ui new-york, Tailwind v4, next-themes, next-intl.
- RSC pattern para `requirePlatformSession()`.
- Fontes otimizadas via `next/font`.

**Gaps:**
- **CSP nonce não consumido no layout** (ALTO, secção 2.1). A estrutura `src/proxy.ts` está correta para Next.js 16; falta apenas consumir o nonce.
- **Build com `--webpack`** devido a bugs do Turbopack no Windows — workaround técnico aceitável a curto prazo, mas deve ser monitorizado.
- **Nenhum teste unitário/integração do web** — só E2E com Playwright.
- **Hook `ui/hooks` vazio** — documentado como gap conhecido.
- **Hardcoded Portuguese** em `layout.tsx` skip link e mensagens de erro em `rpc-client.ts` — mistura de idiomas.

### 3.4 Base de Dados

**Pontos Positivos:**
- Schema de 1343 linhas, bem modelado com enums, relações e índices.
- Idempotency keys com constraints `@@unique([organizationId, ...])`.
- Tenant scoping implementado para a maioria dos modelos.
- Soft-delete extension existe (`packages/database/src/soft-delete.ts`).

**Gaps:**
- **Hard deletes** (secção 2.4).
- **Campos `organizationId` opcionais** em `AuditRecord`, `OutboxEvent`, `Notification`, `IntegrationEvent`, `Role` podem permitir leakage cross-tenant se o contexto de tenant não estiver ativo.
- **Índice em `TwoFactor.secret`** (`schema.prisma:293`) — indexar secrets é anti-padrão de segurança e desnecessário.
- **Não há migration rollback strategy documentada** — já listada em `CURRENT_STATE.md` como gap.

### 3.5 Segurança

**Pontos Positivos:**
- Better Auth com 2FA TOTP, backup codes encriptados, OAuth tokens encriptados.
- CSRF double-submit cookie, CORS restrito, security headers na API.
- Rate limiting com Redis.
- Account lockout após 5 tentativas.
- Session governance e RBAC.

**Gaps:**
- **Middleware CSP inativo** (CRÍTICO).
- **Fallback CSRF com `BETTER_AUTH_SECRET`** (CRÍTICO).
- **Bypass CSRF por header interno** (ALTO).
- **Secrets em `compose.yaml`**: valores como `local-better-auth-secret-for-build-validation-only` e `local-grafana-admin-password` são aceitáveis só para dev local, mas devem ser documentados como não-produtivos.
- **Cookie `better-auth.session_token` hardcoded no parser** (`csrf.middleware.ts:96`) — se Better Auth mudar o nome do cookie, o CSRF falha silenciosamente.

### 3.6 QA / Testes

**Pontos Positivos:**
- 19 ficheiros de teste na API e 11 na RPC com `node:test`.
- E2E com Playwright (chromium, serial, 1 worker).
- CI completo (`platform-ci.yml`) com lint, typecheck, test, e2e, knip.

**Gaps:**
- **UI tests falham** (secção 2.5).
- **Sem ferramenta de coverage** — `CURRENT_STATE.md` confirma.
- **Sem testes frontend unitários**.
- E2E depende de stack completo; pode ser frágil em CI.

### 3.7 DevOps

**Pontos Positivos:**
- Docker multi-stage para API e Web.
- Compose com 9 serviços, healthchecks, volumes persistentes.
- CI/CD com múltiplos gates de validação.
- dotenvx para gestão de envs.

**Gaps:**
- **PowerShell scripts** em `README.md` e possivelmente em `scripts/` — não executam em Linux CI.
- **Web healthcheck** aponta para `/api/health` — a rota existe (`apps/web/app/api/health/route.ts`), mas o `CURRENT_STATE.md` indica que não. Verificar consistência.
- **Docker build web usa `--webpack`** — fragilidade.

### 3.8 Performance

**Pontos Positivos:**
- Next.js standalone, bundle analyzer configurado.
- Redis cache via `cache-manager`.
- OpenTelemetry tracing.
- Server Components por default reduzem bundle JS.

**Gaps:**
- **`force-dynamic` em `apps/web/app/api/health/route.ts`** — aceitável para health, mas deve ser evitado em rotas de dados.
- **Cache invalidation strategy não documentada** para queries RPC.
- **Possíveis N+1** em queries de Tracking/Cargo — requer revisão de cada repositório.

### 3.9 Documentação

**Pontos Positivos:**
- `AGENTS.md` detalhado com stack e comandos.
- `CURRENT_STATE.md` fornece snapshot útil.
- `README.md` descreve AI Engineering OS.

**Gaps:**
- Inconsistências entre `AGENTS.md` e `CURRENT_STATE.md` (número de packages, middleware, Sentry, health route, estrutura `src/app` vs `app/`).
- `CURRENT_STATE.md` não menciona `@saptm/form`.
- Falta ADRs formais.

---

## 4. Matriz de Risco

| # | Finding | Probabilidade | Impacto | Risco |
|---|---|---|---|---|
| 1 | CSP nonce não consumido no layout | Alta | Alto | **Alto** |
| 2 | CSRF fallback com auth secret | Média | Alto | **Crítico** |
| 3 | Hard deletes em domínio | Alta | Alto | **Alto** |
| 4 | Bypass CSRF por header interno | Baixa | Alto | **Alto** |
| 5 | UI tests falham | Alta | Médio | **Alto** |
| 6 | `any` em código runtime | Média | Médio | **Médio** |
| 7 | `console.error` em vez de logger | Alta | Médio | **Médio** |
| 8 | Team não tenant-scoped | Média | Alto | **Alto** |
| 9 | Documentação inconsistente | Alta | Baixo | **Médio** |
| 10 | Sem coverage tooling | Alta | Médio | **Médio** |

---

## 5. Plano de Ação Prioritário

### Imediato (antes de produção)

1. **Consumir CSP nonce no layout**
   - Ler header `x-nonce` em `apps/web/app/layout.tsx`.
   - Aplicar nonce a `<script>` e `<style>` inline.
   - Atualizar `AGENTS.md` e `CURRENT_STATE.md` para refletir a convenção `proxy.ts` do Next.js 16.

2. **Corrigir CSRF**
   - Usar secret CSRF dedicado.
   - Não usar `BETTER_AUTH_SECRET` como fallback de sessão.
   - Ler nome do cookie de sessão de configuração.

3. **Eliminar hard deletes de domínio**
   - Implementar status lifecycle / soft-delete em Cargo, Role, Team, Webhook.

4. **Corrigir UI tests**
   - Ajustar expectativas de testes ou componentes.

### Curto prazo (1-2 sprints)

5. Substituir todos os `as any` e `console.error`.
6. Adicionar `Team` ao tenant scoping (normalizar `orgId` → `organizationId` ou adicionar mapeamento).
7. Configurar coverage tooling (c8 já é dependência).
8. Documentar threat model e ADRs para CSP, CSRF e tenant scoping.

### Médio prazo

9. Resolver workaround `--webpack` / Turbopack.
10. Implementar cache invalidation strategy para RPC.
11. Criar testes unitários para frontend.
12. Revisar todas as queries Prisma para N+1.

---

## 6. Conclusão

O SAPTM tem uma base enterprise promissora, mas **não está pronto para produção** sem correções críticas, particularmente em segurança (CSP/CSRF), integridade de dados (hard deletes) e qualidade (testes de UI falham). A governança e documentação também precisam de sincronização para refletir o estado real do código.

**Próximo passo recomendado:** Executar o plano de ação "Imediato" e submeter a Design QA para validação visual final.

---

## 7. Validação com Context7

Foram consultadas as documentações oficiais atualizadas para validar os findings:

| Tecnologia | Versão consultada | Library ID | Conclusão relevante |
|---|---|---|---|
| Better Auth | v1.6.11 | `/better-auth/better-auth/v1.6.11` | `encryptOAuthTokens: true` é a configuração correta; nomes de cookies podem ser customizados via `advanced.cookies.session_token.name`. |
| Next.js | v16.2.9 | `/vercel/next.js/v16.2.9` | A convenção `middleware.ts` foi renomeada para `proxy.ts` no Next.js 16. `src/proxy.ts` é válido. A função exportada deve chamar-se `proxy`. |
| Prisma | v7.6.0 | `/prisma/prisma/7.6.0` | `onDelete: Cascade` é suportado mas deve ser usado com cuidado em dados de domínio; query extensions são a forma recomendada de implementar tenant scoping via `args.where`. |

Esta validação corrigiu o finding inicial sobre "middleware em falta": o ficheiro `src/proxy.ts` está correto para Next.js 16, sendo o gap real a não-consumo do nonce no layout.

---

*Relatório gerado pelo Enterprise Executive Office com input dos departamentos de Arquitetura, Backend, Frontend, Database, Segurança, QA, DevOps, Performance e Documentação.*
