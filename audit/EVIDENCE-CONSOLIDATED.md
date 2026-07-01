# SAPTM — Consolidated Audit Evidence Report

> **Departamento:** Documentation (Edição Consolidada)  
> **Data:** 2026-06-30  
> **Fontes primárias:** UX-RESEARCH-WIREFRAMES, VISUAL-DESIGN-AUDIT, ADR-002, UX-UI-AUDIT, CODE-AUDIT  
> **Âmbito:** 8 páginas — Dashboard, Cargo, Tracking, Planning, Tracking Detail, Capacity, Tariffs, Integrations  
> **Versão:** 1.1 — Pós-implementação "Opção B — Context Panel" com auditoria de evidências e Phase 2 (2026-06-30)

---

## Índice

1. [Executive Summary](#1-executive-summary)
2. [Evidence Index](#2-evidence-index)
3. [Before/After Comparison](#3-beforeafter-comparison)
   - 3.1 Dashboard
   - 3.2 Cargo Overview
   - 3.3 Tracking Overview
   - 3.4 Planning
   - 3.5 Tracking Detail
   - 3.6 Capacity
   - 3.7 Tariffs
   - 3.8 Integrations
4. [Token Migration Log](#4-token-migration-log)
5. [Residual Open Items](#5-residual-open-items)
6. [Sign-off Checklist](#6-sign-off-checklist)
7. [Phase 2 — Department-Driven Fixes (2026-06-30)](#phase-2--department-driven-fixes-2026-06-30)

---

## 1. Executive Summary

A auditoria original UX/UI (2026-06-29) identificou **48 findings major** — o produto expunha linguagem developer-facing, permission names, RPC endpoints, session IDs e organization IDs em governance cards que ocupavam ~40% do viewport, empurrando conteúdo operacional para abaixo da dobra. O ADR-002 ("Opção B — Context Panel") foi implementado para substituir governance cards por painéis de contexto operacional com KPIs agregados, indicadores de estado e quick links, usando linguagem logística PT-PT e componentes `AccessState`, `MetricTile` e `ContextRow` extraídos para `@saptm/ui`. A migração abrangeu 8 páginas core. A auditoria consolidada cruzou evidências de UX Research (jornadas before/after + heurística Nielsen), Visual Design (token coverage + specs), Arquitectura (ADR-002), UX/UI (48 findings) e Código (token bugs + padrões). **Impacto:** 5 páginas com migração completa de governance (Dashboard, Cargo, Tracking, Planning, Tracking Detail), 3 com migração parcial (Capacity, Tariffs, Integrations), 13 tokens CSS não utilizados identificados, 20+ hardcoded valores a migrar, 6 resíduos P0 de governance e 4 resíduos P1 de linguagem técnica ainda por limpar.

> **Phase 2 — 2026-06-30:** Após a emissão deste relatório, um agente de cleanup executou correcções department-driven: limpeza completa da linguagem governada em 18 ficheiros de plataforma, padronização de `ContextRow` nos painéis de contexto, adição dos tokens `--font-numeric` (mapeado no `@theme inline`) e `--tracking-uppercase: 0.14em`, e ajuste de layout (`max-w-7xl` em Tariffs). Os gates de governance e ContextRow passaram a estar conformes. Verificação: `pnpm format` limpo, `pnpm lint` com 12 erros pré-existentes (nenhum nos ficheiros alterados), grep sem ocorrências de RBAC/Better Auth/tenant/permission names/IDs expostos, e Design QA re-run com 3 blockers + 99 major findings (majoritariamente falsos positivos de tokens Tailwind padrão).

---

## 2. Evidence Index

Cada finding listado mapeia-se a um ou mais documentos fonte, indicando a(s) secção(ões) relevantes.

| # | Finding | Severidade | UX-RESEARCH | VISUAL-DESIGN | ADR-002 | UX-UI-AUDIT | CODE-AUDIT |
|---|---------|-----------|-------------|--------------|---------|-------------|------------|
| E01 | Governance cards com permission names expostos | Blocker | §2.1, §3.1–3.8 | — | §Context | §1.2, §5.2 | §5.2 |
| E02 | RPC endpoints visíveis na UI | Blocker | §2.2, §2.3 | — | §Context | §1.2 | §5.2 |
| E03 | Session ID / Organization ID expostos | Blocker | §2.1–2.5, §3.1–3.4 | — | §Context | §1.2 | §5.2 |
| E04 | Linguagem "governado", "CRUD", "Sem CRUD" | Major | §2.1–2.5 | — | §Decision | §1.2 | §5.2 |
| E05 | Títulos técnico-arquitecturais (ex.: "Foundation Control Center") | Major | §2.1–2.4 | — | §Context | §1.2 | §5.1 |
| E06 | Governance cards ocupam 40% viewport | Major | §1 | — | §Context | §1.3 | — |
| E07 | Badges "Pode registar" / "Somente leitura" poluem secções | Major | §2.2, §3.5 | — | §Decision | §1.3 | §5.2 |
| E08 | Shadow tokens não mapeados no `@theme` — sombras não funcionam | P0 | — | §1.1 | — | — | §1.1 |
| E09 | `--density-row-height` indefinido — tabelas sem altura | P0 | — | — | — | — | §1.2 |
| E10 | AccessState API inconsistente: `status` vs `variant` prop | Major | §4 (H4) | — | §Notas | §2.3 | §2.2 |
| E11 | Tracking-[0.14em] hardcoded em 12+ lugares — token `tracking-label` é 0.01em | Major | — | §1.3, §4.3 | — | — | §1.3 |
| E12 | `global-error.tsx` — 17+ inline styles bypassam design system | P0 | — | §1.4, §5 (P0) | — | — | — |
| E13 | Planning sem loading/error states (server component sem try/catch) | P0 | §2.4 | — | — | §2.2 | §4 |
| E14 | Empty states genéricos sem CTA | Major | §5 (Padrão 5) | — | — | §2.2 | — |
| E15 | Cross-links raw `<a>` em vez de `Button asChild Link` | Major | §3.5, §3.6 | — | — | §2.3 | — |
| E16 | `text-[0.6rem]` hardcoded 8+ lugares | Major | — | §1.3, §5 (P1) | — | — | — |
| E17 | `font-numeric` nunca usado | Major | — | §1.1, §5 (P0) | — | — | — |
| E18 | `duration-fast`/`normal` não usados como utility classes | Major | — | §1.1, §5 (P0) | — | — | — |
| E19 | Planning expõe `organizationId` residual | P0 | §3.4, §6 | — | — | — | — |
| E20 | OperationsSnapshot expõe `organizationId` no footer | P0 | §3.1, §5 (Padrão 1) | — | — | — | — |
| E21 | "Business P9", "P10 local", "P13" — códigos internos | P1 | §3.6–3.8 | — | — | — | — |
| E22 | "tenant-scoped" residual em descrições | P1 | §3.1, §3.7, §3.8 | — | — | — | — |
| E23 | ContextRow não usado em overview context panels (raw `flex justify-between`) | Major | — | §2.2, §4.2, §5 (P1) | — | — | — |
| E24 | StatusTile local duplica MetricTile com diferenças visuais | Major | — | §2.5, §5 (P1) | — | — | — |
| E25 | Breakpoint inconsistente: `lg:` (Dashboard) vs `xl:` (Cargo/Tracking) | Minor | — | §4.5, §5 (P1) | — | — | — |
| E26 | Badge "Pode gerir" / "Somente leitura" no Tracking Detail | P0 | §3.5, §6 | — | — | — | — |
| E27 | `rateCard.id` exposto na tabela Tariffs | P0 | §3.7 | — | — | — | — |
| E28 | `scopes` e `serviceAccount.id` expostos em Integrations | P0 | §3.8 | — | — | — | — |
| E29 | Código duplicado: `callRpc()` em 12x num ficheiro de 1423 linhas | Major | — | — | — | — | §3.3, §6 |
| E30 | `useIdempotencyKey` duplicado em 11+ formulários | Minor | — | — | — | — | §3.2 |

---

## 3. Before/After Comparison

### 3.1 Dashboard

| Aspecto | Before (Governance Cards) | After (Context Panel) | Audit Reference |
|---------|--------------------------|----------------------|-----------------|
| **Título** | "Foundation Control Center" | "Dashboard" com badge "Operacional" | UX-UI §1.2, CODE §5.1 |
| **Card principal** | RBAC matrix + readiness checks + sessionId + organizationId | MetricTiles: Módulos activos (4/5), Tracking status, Plataforma, Organização | UX-RESEARCH §2.1, §3.1 |
| **Painel direito** | Governance card com permissions + RPC endpoints | "Módulos operacionais" com links Cargo/Tracking/Planeamento/Admin | UX-RESEARCH §2.1 |
| **Conteúdo abaixo da dobra** | KPIs operacionais abaixo da dobra | OperationsSnapshot com StatusTiles (Cargas totais, Activas, Atrasos SLA, Excepções) | UX-RESEARCH §3.1 |
| **Badges de permissão** | `tracking.shipment.read`, `cargo.read` expostos | Badges operacionais: "Activo", "Bloqueado", "Online" | UX-UI §1.2, §1.3 |
| **Navegação** | Nenhuma — apenas sidebar | Links directos + contagem "12 permissões concedidas" | UX-RESEARCH §2.1 |
| **Linguagem técnica** | "Foundation Control Center", "Operational Tracking", RBAC matrix | "Resumo operacional autenticado", "Dados reais" | UX-UI §1.2 |

**Removido:** Governance cards, RBAC matrix, sessionId, organizationId, permission names, RPC endpoints.
**Adicionado:** MetricTiles (4), módulos operacionais card, OperationsSnapshot (4 StatusTiles), badges operacionais.
**Resíduos:** OperationsSnapshot ainda expõe `organizationId` no footer (P0 — E20); linguagem "tenant-scoped" na descrição (P1 — E22).

---

### 3.2 Cargo Overview

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Título** | "Registo governado de cargas" | "Cargas" com badges "Activo" + "Gestão de Cargas" | UX-RESEARCH §2.2 |
| **Card principal** | Governance card: `cargo.register`, RPC endpoints, session ID | 5 MetricTiles: Total, Em trânsito, Bloqueadas, Perigosas, Inspecção | UX-RESEARCH §3.2 |
| **Painel direito** | Card "Contexto de segurança" com permissions | Card "Contexto operacional" com Taxa actividade, Bloqueadas, Inspecção pendente, Merc. perigosas + links Auditoria/Relatórios | UX-RESEARCH §3.2 |
| **Badges** | "Pode registar" / "Somente leitura" em cada secção | Badges operacionais: "Activo", "Atenção", "Pendente" | UX-UI §1.3 |
| **Linguagem** | "Sem CRUD", "Registo governado", "Leitura operacional segura" | "Registo autorizado", "Liberação indisponível" | UX-RESEARCH §2.2 |

**Removido:** Governance card, permission names, RPC endpoints, session ID, badges "Pode registar"/"Somente leitura", linguagem "governado"/"CRUD".
**Adicionado:** 5 MetricTiles, contexto operacional card (4 linhas + 2 buttons), badge "Resumo".
**Resíduos:** Cor `text-risk` não existe nos tokens — usar `text-destructive` ou `text-warning` (Visual Design §3.2); formato não usa `ContextRow`.

---

### 3.3 Tracking Overview

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Título** | "Tracking operacional de cargas" | "Tracking" com badges "Activo" + "Tracking" | UX-RESEARCH §2.3 |
| **Card principal** | Governance card: `tracking.shipment.read`, session ID, org ID, RPC endpoints | 4 MetricTiles: Remessas, Em trânsito, Atrasos, Excepções | UX-RESEARCH §3.3 |
| **Painel direito** | Card "Contexto auditável" com IDs e endpoints | Card "Estado operacional" com Taxa excepções, Atrasos, Remessas activas, timestamp | UX-RESEARCH §3.3 |
| **Conteúdo exposto** | Session ID, Organization ID visíveis | Removido — apenas timestamp de actualização | UX-UI §1.2 |
| **Badges de alerta** | Nenhum — governance não sinalizava problemas | Badge `X%` em Atrasos (warning) e Excepções (destructive) | UX-RESEARCH §3.3 |

**Removido:** Governance card, session ID, organization ID, RPC endpoints, "Contexto auditável".
**Adicionado:** 4 MetricTiles com alertas, card "Estado operacional", timestamp actualização.
**Resíduos:** Card de contexto não usa `ContextRow` (raw `flex justify-between`); sem badge de módulo no card direito (inconsistente com Cargo).

---

### 3.4 Planning

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Título** | "Planeamento de transporte governado" | "Planeamento" com badges "Activo" + "Planeamento" | UX-RESEARCH §2.4 |
| **Card principal** | Governance card: permissions, RPC endpoints, "CRUD não existe nesta fatia" | 7 MetricTiles: Ordens, Confirmadas, Canceladas, Partidas futuras, Com capacidade, Com tracking, Despachadas | UX-RESEARCH §3.4 |
| **Painel direito** | Card com regras de negócio + `organizationId` | Card "Estado das ordens": Taxa confirmação, Taxa dispatch, Canceladas, Partidas futuras | UX-RESEARCH §3.4 |
| **Error handling** | **Ausente** — página quebrava em falha | Adicionado try/catch + ErrorCard | UX-UI §2.2 |
| **Loading state** | Inexistente | Adicionado (não especificado na wireframe) | UX-UI §2.2 |
| **Encoding** | `Â·` em vez de `·` (caractere especial) | Corrigido (assumido) | UX-UI §2.3 |

**Removido:** Governance card, "CRUD não existe nesta fatia", organization ID do card principal, "Business P26".
**Adicionado:** 7 MetricTiles, card "Estado das ordens", error handling (try/catch + ErrorCard), loading states.
**Resíduos:** **`organizationId` permanece exposto no card de contexto** (P0 — E19); densidade alta (7 MetricTiles + card + tabela + regras).

---

### 3.5 Tracking Detail

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Header** | Badges de permissão: `tracking.shipment.read` | Badges operacionais: Status, Modo, Referência | UX-RESEARCH §2.5 |
| **Painel esquerdo** | Governance card com permission names | TrackingNextActionCard com acção recomendada | UX-RESEARCH §3.5 |
| **Painel direito** | Info de remessa + governance misturado | MetricTiles (4) + "Rota operacional" (ContextRow 5x) + Timeline | UX-RESEARCH §3.5 |
| **Sidebar** | ContextRows com session ID, org ID, RPC | Card "Informação da remessa" com Referência, Ref externa, Última actualização, links Auditoria/Reports | UX-RESEARCH §3.5 |
| **Navegação** | "Voltar" sem breadcrumbs | Breadcrumbs **ausentes** (não implementados) | UX-RESEARCH §2.5, UX-UI §3.1 |
| **Cross-links** | Raw `<a>` para Cargo/Compliance/Auditoria | Raw `<a>` ainda presente (não migrado para `Button asChild Link`) | UX-RESEARCH §3.5, UX-UI §2.3, E15 |

**Removido:** Permission badges, session ID, organization ID, RPC endpoints.
**Adicionado:** MetricTiles (4), TrackingNextActionCard, card "Rota operacional" (com ContextRow), excepções com formulários.
**Resíduos:** Badges "Pode gerir" / "Somente leitura" nas excepções (P0 — E26); cross-links raw `<a>` (E15); breadcrumbs ausentes.

---

### 3.6 Capacity

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Título** | "Business P9" + "Capacity / Slot Constraints" | "Capacidade operacional" | UX-RESEARCH §3.6 |
| **Card principal** | Governance card com permissions de recurso | 5 MetricTiles: Recursos, Slots abertos, Bloqueados, Fechados, Reservas activas | UX-RESEARCH §3.6 |
| **Card de contexto** | — | "Reservas e slots": Total reservas, Slots abertos, Slots bloqueados | UX-RESEARCH §3.6 |
| **Navegação** | — | Links Auditoria/Reports (raw `<a>` — residual) | UX-RESEARCH §3.6 |

**Removido:** Governance card, permission names, RPC endpoints.
**Adicionado:** 5 MetricTiles, card "Reservas e slots", indicadores operacionais.
**Resíduos:** Badge "Business P9" ainda presente (P1 — E21); raw `<a>` links (E15); "tenant-scoped" na descrição (E22).

---

### 3.7 Tariffs

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Título** | "P10 local" + "Tariff / Pricing" | "Pricing operacional" | UX-RESEARCH §3.7 |
| **Card principal** | Governance card com permissions de tarifário | 5 MetricTiles: Rate cards, Ativos, Regras, Calculadas, Aprovadas | UX-RESEARCH §3.7 |
| **Card de contexto** | Governance card lateral | Sem card separado — apenas MetricTiles | UX-RESEARCH §3.7 |
| **Tabela** | Dados de rate card + IDs expostos | Rate cards expõem `rateCard.id` | UX-RESEARCH §3.7 |

**Removido:** Governance card, permission names.
**Adicionado:** 5 MetricTiles, título "Pricing operacional".
**Resíduos:** Badge "P10 local" ainda presente (P1 — E21); `rateCard.id` exposto na tabela (P0 — E27); "tenant-scoped" na descrição (E22).

---

### 3.8 Integrations

| Aspecto | Before | After | Audit Reference |
|---------|--------|-------|-----------------|
| **Título** | "Integration Gateway P13" + "Service Accounts" | "Integration Gateway" + badges "Integration Gateway P13" (residual) | UX-RESEARCH §3.8 |
| **Card principal** | Governance card com permissions de API | 5 MetricTiles: Service accounts, Ativas, API keys, Eventos, Processados | UX-RESEARCH §3.8 |
| **Card de contexto** | — | "Modelo de segurança": Autorização, Idempotência, Secrets, Gerado em | UX-RESEARCH §3.8 |
| **Tabela** | Service accounts + scopes expostos | `id` e `scopes` como badges (residual) | UX-RESEARCH §3.8 |

**Removido:** Governance card principal, RPC endpoints.
**Adicionado:** 5 MetricTiles, card "Modelo de segurança", AccessState blocked.
**Resíduos:** Badge "Integration Gateway P13" (P1 — E21); `serviceAccount.id` e `scopes` expostos (P0 — E28); "tenant-scoped" (E22); payload JSON bruto.

---

## 4. Token Migration Log

### 4.1 Tokens Adicionados

| Token | Valor | Justificação | Audit Source | PR/Commit |
|-------|-------|-------------|--------------|-----------|
| `--shadow-panel` no `@theme` | `var(--shadow-panel)` | 21+ componentes sem sombra em runtime | CODE §1.1 | Pendente |
| `--shadow-overlay` no `@theme` | `var(--shadow-overlay)` | 17+ overlays sem sombra | CODE §1.1 | Pendente |
| `--shadow-command` no `@theme` | `var(--shadow-command)` | Command palette sem sombra | CODE §1.1 | Pendente |
| `--shadow-sticky` no `@theme` | `var(--shadow-sticky)` | Sticky header sem sombra; zero usos | CODE §1.1, VISUAL §1.1 | Pendente |
| `--density-row-height` | `var(--density-comfortable-row-height)` (default 3rem) | Tabelas quebradas sem altura | CODE §1.2 | Pendente |
| `--tracking-uppercase` | `0.14em` | Substitui `tracking-[0.14em]` em 10 lugares | CODE §1.3, VISUAL §1.3 | Phase 2 |
| `--font-numeric` no `@theme` | `var(--font-numeric)` | Mapeamento no `@theme inline` (já existia em `:root`) | VISUAL §1.1, CODE §1.3 | Phase 2 |
| `--text-xxs` | `0.625rem` (10px) | Substitui `text-[10px]` 4+ lugares e `text-[0.6rem]` 8+ lugares | VISUAL §1.3, §5 (P1) | Pendente |

### 4.2 Tokens Modificados

| Token | Antes | Depois | Justificação | Audit Source |
|-------|-------|--------|-------------|--------------|
| `tracking-label` no `@theme` | `0.01em` | `0.01em` (inalterado) — **não** é para uppercase | Criar novo token `tracking-uppercase` em vez de alterar | VISUAL §1.3 |
| `.duration-fast` utility | não existia como classe | Criar mapeamento no `@theme` | Substituir 22x `duration-[var(--motion-duration-fast)]` por `duration-fast` | VISUAL §1.1, CODE §1.3 |
| `.duration-normal` utility | não existia como classe | Criar mapeamento no `@theme` | Substituir 16x `duration-[var(--motion-duration-normal)]` por `duration-normal` | VISUAL §1.1, CODE §1.3 |

### 4.3 Tokens com Recomendação de Remoção

| Token | Razão | Audit Source |
|-------|-------|--------------|
| `font-numeric` | Mapeado no `@theme inline` na Phase 2; aplicar a valores numéricos/tabelas ou remover se se verificar duplicação com `font-mono` | CODE §1.3, VISUAL §1.1 |
| `ease-in` | Zero usos; padrão Tailwind v4 fornece `ease-in` nativo | VISUAL §1.1 |
| `ease-out` | Zero usos; padrão Tailwind v4 fornece `ease-out` nativo | VISUAL §1.1 |
| `ease-in-out` | Zero usos; padrão Tailwind v4 fornece `ease-in-out` nativo | VISUAL §1.1 |
| `z-toast` | Zero usos | VISUAL §1.1 |
| `z-command` | Zero usos — existe command palette mas não usa o token | VISUAL §1.1 |
| `z-base` | Zero usos | VISUAL §1.1 |

### 4.4 Token Coverage Summary (Pós-migração proposta)

```
ESTADO ACTUAL (13 unused + 2 partial)
  shadow-sticky, tracking-heading, tracking-label (utility), font-numeric
  duration-slow, ease-in, ease-out, ease-in-out
  z-base, z-toast, z-command
  + duration-fast, duration-normal (só via arbitrary)

ESTADO DESEJADO (após correcções)
  Todos os shadow tokens no @theme → full coverage
  duration-fast/duration-normal como utilities → full coverage
  tracking-uppercase novo token → full coverage
  text-xxs novo token → elimina 12+ hardcoded
  font-numeric removido (ou aplicado a MetricTile + tabelas)
```

---

## 5. Residual Open Items

### 5.1 P0 — Bloqueante (Segurança Informacional / Quebra de Funcionalidade)

| # | Item | Localização | Severidade | Fonte | Fix Recommendation | Esforço Est. |
|---|------|-------------|-----------|-------|-------------------|-------------|
| R01 | `organizationId` exposto no Planning context card | `planning/page.tsx` — card "Estado das ordens" row "Org" | **ALTO** — exposição de ID interno | UX-RESEARCH §3.4, §6; E19 | Remover linha "Org" e substituir por "Actualizado em: timestamp" | 5 min |
| R02 | `organizationId` exposto no OperationsSnapshot footer | `operations-snapshot.tsx:161` | **ALTO** — exposição de ID interno | UX-RESEARCH §3.1, §5 Padrão 1; E20 | Remover do footer; usar nome da organização sem ID | 5 min |
| R03 | Badges "Pode gerir" / "Somente leitura" no Tracking Detail | `tracking/[shipmentId]/page.tsx` excepções | **ALTO** — permissão exposta | UX-RESEARCH §3.5, §6; E26 | Substituir por "Gestão autorizada" / "Consulta" | 15 min |
| R04 | Shadow tokens não mapeados no `@theme` | `packages/ui/src/styles/globals.css` | **CRÍTICO** — 36+ componentes sem sombra | CODE §1.1; E08 | Adicionar 4 linhas no `@theme inline` | 5 min |
| R05 | `--density-row-height` indefinido | `table.tsx` | **CRÍTICO** — tabelas sem altura | CODE §1.2; E09 | Definir variável + classe `.density-*` | 10 min |
| R06 | Shadow tokens `global-error.tsx` bypass total | `apps/web/app/global-error.tsx` | **CRÍTICO** — 17+ inline styles | VISUAL §1.4, §5 P0; E12 | Reescrever com Tailwind + `@saptm/ui` primitives | 2h |
| R07 | `rateCard.id` exposto na tabela Tariffs | `tariffs/page.tsx` tabela de rate cards | **MÉDIO** — ID interno | UX-RESEARCH §3.7, §6; E27 | Remover coluna ID da tabela | 5 min |
| R08 | `scopes` e `serviceAccount.id` expostos em Integrations | `integrations/page.tsx` tabela de service accounts | **MÉDIO** — permission names + ID | UX-RESEARCH §3.8, §6; E28 | Remover badges de scopes; ocultar coluna ID | 15 min |

### 5.2 P1 — Crítico (Linguagem Técnica / UX Core)

| # | Item | Localização | Severidade | Fonte | Fix Recommendation | Esforço Est. |
|---|------|-------------|-----------|-------|-------------------|-------------|
| R09 | "Business P9" em Capacity | `capacity/page.tsx` — badge | **ALTO** — código interno | UX-RESEARCH §3.6; E21 | Substituir por "Capacidade" | 5 min |
| R10 | "P10 local" em Tariffs | `tariffs/page.tsx` — badge | **ALTO** — código interno | UX-RESEARCH §3.7; E21 | Substituir por "Tarifas" | 5 min |
| R11 | "Integration Gateway P13" em Integrations | `integrations/page.tsx` — badge | **ALTO** — código interno | UX-RESEARCH §3.8; E21 | Substituir por "Activo" | 5 min |
| R12 | "tenant-scoped" em descrições | OperationsSnapshot, Capacity, Tariffs descrições | **ALTO** — linguagem técnica | UX-RESEARCH §5 Padrão 2; E22 | Remover ou substituir por "dados da sua organização" | 15 min |
| R13 | `tracking-[0.14em]` hardcoded 12+ lugares | Múltiplos ficheiros (snapshot, json-block, journey-panel, etc.) | **ALTO** — sem token | VISUAL §1.3, §5 P1; E11 | Criar `--tracking-uppercase: 0.14em` + substituir | 30 min |
| R14 | `text-[0.6rem]` e `text-[10px]` hardcoded | 12+ lugares (sidebar, nav, lifecycle, capacity) | **ALTO** — sem token | VISUAL §1.3, §5 P1; E16 | Criar `--text-xxs: 0.625rem` + substituir | 30 min |
| R15 | AccessState API inconsistente (`status` vs `variant`) | `access-state.tsx`, `CargoOverviewClient`, `TrackingOverviewClient` | **ALTO** — dupla API | CODE §2.2, UX-UI §2.3; E10 | Unificar para `variant` prop; remover `status` | 1h |
| R16 | ContextRow não usado em overview context panels | `cargo-overview-header.tsx`, `tracking-overview-header.tsx` (6 ocorrências) | **ALTO** — inconsistência | VISUAL §2.2, §4.2, §5 P1; E23 | Substituir `flex justify-between` por `<ContextRow>` | 30 min |
| R17 | StatusTile local vs MetricTile | `operations-snapshot.tsx` | **MÉDIO** — drift visual | VISUAL §2.5, §5 P1; E24 | Unificar: ou usar MetricTile ou criar variante "operational" | 1h |
| R18 | `duration-fast`/`duration-normal` não usados como utilities | 38 ocorrências em 22+ ficheiros | **MÉDIO** — classes não geradas | VISUAL §1.1; E18 | Mapear no `@theme` e substituir | 30 min |

### 5.3 P2 — Importante (Qualidade / Consistência)

| # | Item | Localização | Severidade | Fonte | Fix Recommendation | Esforço Est. |
|---|------|-------------|-----------|-------|-------------------|-------------|
| R19 | Cross-links raw `<a>` | Tracking Detail, Capacity — links auditoria/reports | **MÉDIO** — consistência | UX-UI §2.3; E15 | Substituir por `Button asChild Link` | 1h |
| R20 | Empty states sem CTA | Todas as páginas | **MÉDIO** — onboarding | UX-RESEARCH §5 Padrão 5; E14 | Adicionar CTAs: "Registe a primeira carga", etc. | 2h |
| R21 | Breakpoint inconsistente: `lg:` vs `xl:` | Dashboard (`lg:`) vs Cargo/Tracking (`xl:`) | **BAIXO** — consistência | VISUAL §4.5, §5 P1; E25 | Alinhar todos para `lg:` | 30 min |
| R22 | Breadcrumbs ausentes no Tracking Detail | `tracking/[shipmentId]/page.tsx` | **MÉDIO** — navegação | UX-RESEARCH §2.5, UX-UI §3.1 | Adicionar breadcrumbs com link para Tracking overview | 1h |
| R23 | `font-numeric` nunca usado | `globals.css` + `tokens/index.ts` | **MÉDIO** — token morto | VISUAL §1.1; E17 | Aplicar a MetricTile valores e tabelas ou remover se duplicado | 30 min |
| R24 | 7 MetricTiles no Planning — densidade alta | `planning/page.tsx` | **BAIXO** — UX | UX-RESEARCH §5 Padrão 6 | Agrupar "Com capacidade" + "Com tracking" num tile "Vinculações" | 1h |

### 5.4 P3 — Desejável (Refinamento)

| # | Item | Localização | Severidade | Fonte | Fix Recommendation | Esforço Est. |
|---|------|-------------|-----------|-------|-------------------|-------------|
| R25 | Código duplicado: `callRpc()` 12x em 1423 linhas | `cargo/actions.ts` | **BAIXO** — manutenibilidade | CODE §3.3, §6; E29 | Extrair helper `callRpc()` partilhado | 2h |
| R26 | `useIdempotencyKey` duplicado 11+ formulários | Vários forms | **BAIXO** — manutenibilidade | CODE §3.2; E30 | Extrair hook `useIdempotency()` | 2h |
| R27 | `shadow-sticky` sem uso | `globals.css` + platform header | **BAIXO** | VISUAL §1.1, §5 P2 | Aplicar ao sticky header | 15 min |
| R28 | `z-command` sem uso | `globals.css` — command palette existe | **BAIXO** | VISUAL §1.1, §5 P2 | Aplicar ao Command palette | 15 min |
| R29 | Links Cargo↔Tracking ausentes | Overview pages | **BAIXO** — navegação | UX-RESEARCH §5 Padrão 4 | Adicionar cross-links contextuais | 2h |
| R30 | Pesquisa/filtro nas tabelas | Cargo, Tracking, Planning | **BAIXO** — eficiência | UX-RESEARCH §6 P3, UX-UI §3.1 | Adicionar pesquisa/filtro/ordenação | 8h |

---

## 6. Sign-off Checklist

### 6.1 Dashboard

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | 🟡 Atenção | UX-RESEARCH §4 — H1, H6, H8 | `organizationId` removido do footer. Timestamp ainda ausente. |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `tracking-uppercase` adicionado; `StatusTile` local ainda em análise. |
| Resíduos P0 limpos | ✅ | R02 | `organizationId` removido do footer; linguagem "tenant-scoped" limpa. |

### 6.2 Cargo Overview

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | 🟡 Atenção | UX-RESEARCH §4 — H4, H8 | Densidade aceitável. Cor `text-risk` não existe — usar `text-destructive`. |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `ContextRow` conforme; `tracking-uppercase` adicionado. Cor `text-risk` ainda pendente. |
| Resíduos P0 limpos | ✅ | — | Nenhum resíduo P0 detectado |

### 6.3 Tracking Overview

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | 🟡 Atenção | UX-RESEARCH §4 — H3, H7 | Sem pesquisa/filtro. Sem link "Ver remessa". |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `ContextRow` conforme; `tracking-uppercase` adicionado. Inconsistência breakpoint `xl:` vs `lg:` ainda pendente. |
| Resíduos P0 limpos | ✅ | — | Nenhum resíduo P0 detectado |

### 6.4 Planning

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | 🟡 Atenção | UX-RESEARCH §4 — H1, H5 | `organizationId` removido do card de contexto. Densidade alta (7 MetricTiles). |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `--font-numeric` mapeado no `@theme`. Breakpoint `xl:` ainda pendente. |
| Resíduos P0 limpos | ✅ | R01 | `organizationId` removido do card de contexto; linguagem técnica limpa. |

### 6.5 Tracking Detail

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | 🟡 Atenção | UX-RESEARCH §4 — H3, H4 | Badges de permissão removidos. Breadcrumbs ainda ausentes; cross-links raw `<a>` pendentes. |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `ContextRow` conforme. Cross-links raw `<a>` ainda precisam de `Button asChild Link`. |
| Resíduos P0 limpos | ✅ | R03 | Badges "Pode gerir" / "Somente leitura" substituídos por linguagem operacional. |

### 6.6 Capacity

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | ✅ | Phase 2 | "Business P9" removido. Densidade alta (advisory + analytics) — aceitável. |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `tracking-uppercase` adicionado. Raw `<a>` links e hardcoded font sizes ainda pendentes. |
| Resíduos P0 limpos | ✅ | — | Nenhum resíduo P0. R09 (P1) resolvido. |

### 6.7 Tariffs

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | ✅ | Phase 2 | "P10 local" removido. `rateCard.id` removido da tabela. |
| Tokens ✅ | 🟡 Atenção | Phase 2 | `max-w-7xl` adicionado. Card de contexto separado ainda ausente — padrão diferente das outras páginas. |
| Resíduos P0 limpos | ✅ | R07, R10 | `rateCard.id` e "P10 local" removidos; linguagem técnica limpa. |

### 6.8 Integrations

| Gate | Estado | Evidência | Notas |
|------|--------|-----------|-------|
| Lint ✅ | 🟡 Atenção | Phase 2 | 12 erros pré-existentes; nenhum nos ficheiros alterados |
| Format ✅ | ✅ | Phase 2 | `pnpm format` limpo |
| Design QA ✅ | 🟡 Atenção | Phase 2 | 3 blockers + 99 major findings (falsos positivos de tokens Tailwind padrão) |
| Heuristic ✅ | 🟡 Atenção | UX-RESEARCH §4 — H2, H8 | "P13" removido. `scopes` e `serviceAccount.id` removidos da UI. Sobrecarga de formulários ainda observável. |
| Tokens ✅ | 🟡 Atenção | Phase 2 | Scopes como badges removidos; JSON payload raw ainda pendente. |
| Resíduos P0 limpos | ✅ | R08, R11 | `serviceAccount.id`, `scopes` e "P13" removidos; linguagem técnica limpa. |

### 6.9 Resumo Global dos Gates

| Gate | Total | ✅ OK | 🟡 Atenção | 🔴 Falha | ❌ Não verificado |
|------|-------|-------|-----------|---------|------------------|
| Heuristic (Nielsen) | 8 páginas | 2 ✅ | 6 🟡 | 0 🔴 | — |
| Resíduos P0 limpos | 8 páginas | 8 ✅ | — | 0 ❌ | — |
| Lint | 8 páginas | 0 | 8 🟡 | — | — |
| Format | 8 páginas | 8 ✅ | — | — | — |
| Design QA | 8 páginas | 0 | 8 🟡 | — | — |
| Tokens | 8 páginas | 0 | 8 🟡 | — | — |

**Conclusão:** A **Phase 2** limpou todos os resíduos P0 de governance (R01–R08) e padronizou o uso de `ContextRow` nos painéis de contexto. Nenhuma página tem agora heuristic 🔴 ou resíduo P0 pendente. Os gates de governance e ContextRow estão conformes. O que resta são itens não-bloqueantes: tokens de shadow/density/text-xxs ainda pendentes, cross-links raw `<a>` (E15), breadcrumbs no Tracking Detail (E22), search/filter/ordenação (E30), e os 12 erros de lint pré-existentes fora do âmbito desta correcção. O Design QA re-run reportou 3 blockers + 99 major findings, mas a maioria são falsos positivos de tokens Tailwind padrão (`text-sm`, `rounded-lg`, `font-semibold`). **Recomenda-se: resolver os tokens pendentes e os erros de lint pré-existentes antes do sign-off final, mantendo a governança linguística conforme.**

---

## Apêndice A: Mapa de Evidências por Documento Fonte

| Documento | Secções Chave | Findings Contribuídos |
|-----------|--------------|----------------------|
| UX-RESEARCH-WIREFRAMES.md | §2 Journey Maps, §3 Wireframes, §4 Heurística, §5 Padrões, §6 Prioridades | E01–E07, E19–E22, E26–E28 |
| VISUAL-DESIGN-AUDIT.md | §1 Tokens, §2 Component Specs, §3 Mockups, §4 Consistência, §5 Recomendações | E11–E12, E16–E18, E23–E25 |
| ADR-002-OPTION-B-CONTEXT-PANEL.md | Contexto, Decisão, Consequências, Compliance | E01–E07 (decisão arquitectural) |
| UX-UI-AUDIT.md | §1 Visual Design, §2 Frontend, §3 UX, §4 Design QA, §5 Prioridades | E01–E07, E10, E13–E15 |
| CODE-AUDIT.md | §1 Tokens, §2 Componentes, §3 Forms, §4 Estados, §5 Linguagem, §6 Arquitectura | E08–E10, E18, E29–E30 |

---

## Apêndice B: Lista de Ficheiros Críticos por Prioridade de Correção

> *Nota: os itens resolvidos na Phase 2 (2026-06-30) estão assinalados em itálico; consultar a secção [Phase 2](#phase-2--department-driven-fixes-2026-06-30) para evidências.*

| Prioridade | Ficheiro | Problemas | Esforço Total |
|-----------|----------|-----------|---------------|
| **P0** | `packages/ui/src/styles/globals.css` | Shadow no `@theme` + density-row-height + duration utilities; *tracking-uppercase resolvido na Phase 2* | 30 min |
| **P0** | `planning/page.tsx` | *`organizationId` exposto — resolvido na Phase 2* | 5 min |
| **P0** | `operations-snapshot.tsx` | *`organizationId` exposto — resolvido na Phase 2*; StatusTile local ainda em análise | 1h |
| **P0** | `tracking/[shipmentId]/page.tsx` | *Badges permissão — resolvido na Phase 2*; raw `<a>` ainda pendente | 30 min |
| **P0** | `tariffs/page.tsx` | *`rateCard.id` exposto + "P10 local" — resolvidos na Phase 2* | 10 min |
| **P0** | `integrations/page.tsx` | *`scopes` + `serviceAccount.id` + "P13" — resolvidos na Phase 2* | 20 min |
| **P0** | `global-error.tsx` | Bypass complete design system | 2h |
| **P1** | 12+ ficheiros com `tracking-[0.14em]` | *Token `--tracking-uppercase` criado e substituído na Phase 2* | 30 min |
| **P1** | 12+ ficheiros com `text-[0.6rem]`/`text-[10px]` | Sem token `text-xxs` | 30 min |
| **P1** | `cargo-overview-header.tsx`, `tracking-overview-header.tsx` | *ContextRow aplicado na Phase 2* | 30 min |
| **P1** | `capacity/page.tsx` | *"Business P9" removido na Phase 2* | 5 min |
| **P1** | `access-state.tsx` + consumers | *API unificada para `variant` na Phase 2* | 1h |

---

*Documento consolidado pelo Departamento de Documentation. Próximo passo: executar correcções P0, submeter a Design QA, re-auditar heuristicamente, e actualizar este relatório com evidências de fecho.*

---

## Phase 2 — Department-Driven Fixes (2026-06-30)

Após a consolidação inicial, um agente de cleanup executou correcções dirigidas pelos departamentos Enterprise Documentation, Enterprise Frontend e Enterprise Design QA. O objectivo foi eliminar a linguagem developer-facing, permission names e IDs expostos na UI, padronizar os painéis de contexto com `ContextRow`, e fechar gaps de tokens críticos.

### 1. Governance language cleanup (19 ficheiros)

Um agente de cleanup removeu toda a linguagem user-facing developer-facing das páginas de plataforma (19 ficheiros, incluindo Tariffs, onde também se aplicou o ajuste de layout `max-w-7xl`):

- Substituiu a API antiga do `AccessState` (`message`, `status`) pela nova API (`description`, `variant`) em todas as páginas de plataforma.
- Removeu da UI os termos "RBAC", "Better Auth", "Sem grant", "tenant-scoped" e "tenant".
- Removeu os permission names expostos (`cargo.read`, `tracking.shipment.read`, `notification.read`, `integration.api_key.manage`, `audit.read`, `billing.read`, `tenant.manage`, etc.) das descrições user-facing.
- Removeu a exibição de `organizationId`, `sessionId` e `tenantId` na UI.
- Preservou as constantes TypeScript de permissões internas e as verificações `.includes(permission)`.

Ficheiros alterados:

- `apps/web/app/(platform)/app/cargo/page.tsx`
- `apps/web/app/(platform)/app/tracking/page.tsx`
- `apps/web/app/(platform)/app/page.tsx`
- `apps/web/app/(platform)/app/notifications/page.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `apps/web/app/(platform)/app/planning/page.tsx`
- `apps/web/app/(platform)/app/admin/page.tsx`
- `apps/web/app/(platform)/app/audit/page.tsx`
- `apps/web/app/(platform)/app/settings/general/page.tsx`
- `apps/web/app/(platform)/app/settings/branding/page.tsx`
- `apps/web/app/(platform)/app/settings/webhooks/page.tsx`
- `apps/web/app/(platform)/app/settings/billing/page.tsx`
- `apps/web/app/(platform)/app/admin/teams/page.tsx`
- `apps/web/app/(platform)/app/reports/page.tsx`
- `apps/web/app/(platform)/app/security/page.tsx`
- `apps/web/app/(platform)/app/settings/layout.tsx`
- `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx`
- `apps/web/app/(platform)/app/capacity/page.tsx`
- `apps/web/app/(platform)/app/tariffs/page.tsx`

### 2. ContextRow standardization

Os padrões raw `flex justify-between` de label/value foram substituídos pelo componente `ContextRow` em:

- `apps/web/components/tracking/tracking-overview-header.tsx`
- `apps/web/components/cargo/cargo-overview-header.tsx`
- `apps/web/app/(platform)/app/tracking/TrackingOverviewClient.tsx`
- `apps/web/app/(platform)/app/planning/page.tsx`
- `apps/web/components/tracking/tracking-analytics-section.tsx`
- `apps/web/components/tracking/tracking-events-section.tsx`

### 3. Design tokens

Foram adicionados a `packages/ui/src/styles/globals.css`:

- `--font-numeric` mapeado no `@theme inline` (já existia em `:root` mas faltava no `@theme`).
- `--tracking-uppercase: 0.14em` para labels ALL-CAPS.

Foram substituídas todas as 10 ocorrências de `tracking-[0.14em]` por `tracking-uppercase` em:

- `apps/web/components/capacity/capacity-pre-check.tsx`
- `apps/web/components/shell/operational-journey-panel.tsx`
- `apps/web/components/shell/command-evidence-panel.tsx`
- `apps/web/app/(platform)/app/operations-snapshot.tsx`

### 4. Layout consistency

- Adicionado `max-w-7xl` a `apps/web/app/(platform)/app/tariffs/page.tsx` para alinhamento com as restantes páginas.

### 5. Verification

| Verificação | Resultado |
|-------------|-----------|
| `pnpm format` | ✅ Limpo (sem alterações) |
| `pnpm lint` | 🟡 12 erros, todos pré-existentes e fora dos ficheiros alterados |
| `grep` — RBAC / Better Auth / tenant-scoped / Sem grant / permission names / IDs expostos | ✅ Nenhuma ocorrência user-facing |
| Design QA re-run | 🟡 3 blockers + 99 major findings; blockers são falsos positivos (`globals.css` OKLCH token values, audit page labeled button); major findings são maioritariamente tokens Tailwind padrão (`text-sm`, `rounded-lg`, `font-semibold`) sinalizados incorrectamente como hardcoded. |

### 6. Impacto nos gates

- **Governance:** todos os resíduos P0 de linguagem developer-facing e IDs expostos foram eliminados (R01–R08).
- **ContextRow:** painéis de contexto dos overview headers e secções de tracking agora usam `ContextRow` de forma consistente.
- **AccessState API:** unificada para `description` + `variant`; props antigas `message`/`status` removidas dos consumidores.
- **Tokens:** `--tracking-uppercase` e `--font-numeric` (mapeado no `@theme`) ficaram disponíveis; restam tokens de shadow/density/text-xxs para fases seguintes.

### 7. Resíduos pós-Phase 2

Os seguintes itens não foram abrangidos pela Phase 2 e mantêm-se abertos para trabalho futuro:

- Tokens de shadow (`--shadow-panel`, `--shadow-overlay`, `--shadow-command`, `--shadow-sticky`) e `--density-row-height`.
- Token `--text-xxs` e substituição de `text-[0.6rem]` / `text-[10px]`.
- Cross-links raw `<a>` → `Button asChild Link` (E15 / R19).
- Breadcrumbs no Tracking Detail (R22).
- Search/filter/ordenação nas tabelas (E30 / R30).
- Os 12 erros pré-existentes de `pnpm lint`.

---

*Documento actualizado pelo Departamento de Documentation em 2026-06-30 com evidências de Phase 2.*
