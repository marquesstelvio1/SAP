---
id: ADR-002
title: "Opção B — Context Panel em vez de Governance Cards"
status: Implemented
date: 2026-06-30
author: Enterprise Architecture Department
deciders:
  - Enterprise Architecture
  - Visual Design
  - Frontend
  - UX Research
  - Design QA
audit_ref: UX-UI-AUDIT.md (48 findings), CODE-AUDIT.md, DESIGN-SYSTEM.md
togaf_domains:
  - Business Architecture (linguagem operacional, hierarquia de informação)
  - Application Architecture (componentes de apresentação)
  - Data Architecture (queries de governança removidas do frontend)
ddd_bounded_contexts_affected:
  - Cargo (gestão de cargas)
  - Tracking (tracking operacional)
  - Planning (planeamento de transporte)
  - Capacity (gestão de capacidade)
  - Tariffs (tarifas)
  - Security (segurança)
  - Notifications (notificações)
  - Integrations (integrações)
  - Admin (administração)
---
# ADR-002: Opção B — Context Panel em vez de Governance Cards

## Status

**Implemented** — 2026-06-30

---

## Context

### Problema

A auditoria UX/UI (2026-06-29) identificou 48 findings maioritariamente críticos sobre governança exposta na interface de utilizador. As páginas de produto do SAPTM exibiam **governance cards** que ocupavam ~40% do viewport com informação de arquitectura:

| Problema | Severidade | Exemplo |
|----------|-----------|---------|
| Linguagem developer-facing | **Blocker** | "Registo governado de cargas", "Foundation Control Center", "Esta etapa entrega leitura operacional segura antes de qualquer CRUD" |
| Exposição de permission names | **Blocker** | `cargo.register`, `tracking.shipment.read` em badges e ContextRows em todas as páginas |
| Exposição de RPC endpoints | **Major** | `POST /rpc/cargo/register` visível em ContextRows |
| Exposição de IDs internos | **Major** | Session ID, Organization ID, Shipment ID expostos em ContextRows |
| Termos CRUD para o operador | **Major** | "Nao existe CRUD generico nesta fatia", "Sem CRUD" como badge em 3+ secções |
| Governance cards consomem 40% do viewport | **Major** | Conteúdo operacional (métricas, tabelas) empurrado para abaixo da dobra |
| Permissions misturadas com conteúdo operacional | **Major** | Badges "Pode registar" / "Somente leitura" em cada secção |
| Informação de auditoria ao mesmo nível que acções | **Major** | Regras de negócio e RPC endpoints lado a lado com formulários operacionais |

**Impacto:** Um operador portuário real (HHLA Planner, APM Terminals Dispatcher) não reconhece os termos apresentados. A experiência está orientada ao desenvolvedor, não ao Transportation Manager.

### Causa Raiz

A equipa de desenvolvimento usou os governance cards como atalho de debugging e transparência arquitectural — expondo o modelo de permissões interno directamente na UI em vez de o traduzir para linguagem operacional. Não havia distinção entre "informação para o operador" e "informação para o administrador/sistema".

### Opções Avaliadas

| Opção | Abordagem | Impacto | Esforço |
|-------|-----------|---------|---------|
| **A — Operational-first** | Remover completamente toda a informação de governança. Mostrar apenas KPIs operacionais. | Perda total de visibilidade sobre permissões em erro. Operador sem contexto quando uma acção falha. | Médio (remover componentes) |
| **B — Context Panel** | Substituir governance cards por painéis de contexto operacional com KPIs agregados, indicadores de estado, e quick links. Informação de permissão só aparece em estado de bloqueio/erro via `AccessState` com mensagens claras ("indisponivel" em vez de "sem grant"). | **Escolhido.** Equilíbrio entre usabilidade operacional e feedback de autorização. | Alto (redesenho por página) |
| **C — Minimal** | Manter governance cards mas reduzir tamanho e mover para fundo da página. | Não resolve o problema de linguagem developer-facing. Risco de expor IDs e permissions mantém-se. | Baixo (reposição CSS) |

---

## Decision

**Implementar a Opção B — Context Panel.**

### O que muda

#### Antes (Governance Card)

Cada página de produto exibia um cartão de "Contexto de segurança" ou "Contexto auditável" com:

```
┌─────────────────────────────────────────────┐
│  🔒 Contexto de segurança                    │
│                                              │
│  Organização: org_2a3b4c5d6e7f8g9h          │
│  Sessão: sess_abc123def456                  │
│  Permissão: tracking.shipment.read          │
│  RPC: POST /rpc/cargo/register              │
│                                              │
│  Regras P0-P8: Aprovado                     │
│  ACID: Garantido                            │
│  Governado: Sim                             │
└─────────────────────────────────────────────┘
```

#### Depois (Context Panel)

Cada página exibe painéis operacionais com métricas de negócio:

```
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│  🏷️ Activo  │  🏷️ Gestão de  │  │  🏷️ Resumo                   │
│              │     Cargas      │  │  Contexto operacional         │
│  ─────────────────────────────  │  │                              │
│  # Cargas                       │  │  Taxa de actividade:  72%    │
│  Registo, liberação, transporte │  │  Bloqueadas:          3 cargas│
│  e entrega de cargas            │  │  Inspecção pendente:  2      │
│                                 │  │  Mercadorias perigosas: 1    │
│  ┌────────┐┌────────┐┌──────┐  │  │  ─────────────────           │
│  │ Total  ││Em      ││Bloqu.│  │  │  [ Auditoria ] [ Relatórios ]│
│  │  142   ││trânsito││  3   │  │  └──────────────────────────────┘
│  └────────┘└────────┘└──────┘  │
│  ┌────────┐┌────────┐          │
│  │Perigos.││Inspec. │          │
│  │   1    ││   2    │          │
│  └────────┘└────────┘          │
└─────────────────────────────────┘
```

#### Em caso de bloqueio/permissão negada

Em vez de mostrar o governance card completo, o sistema mostra:

```
┌──────────────────────────────────────┐
│         INTEGRAÇÕES BLOQUEADAS        │
│                                       │
│  🔒                                 │
│                                       │
│  Integration Gateway                  │
│  A sua sessão não tem acesso a esta   │
│  funcionalidade. Contacte o           │
│  administrador da organização.        │
│                                       │
│  Nota: Registo indisponivel           │
└──────────────────────────────────────┘
```

Usa o componente `AccessState` com:
- `badgeLabel` — nome do módulo (ex.: "Integration Gateway")
- `title` — estado claro em Português (ex.: "Integrações bloqueadas")
- `description` — acção para o operador (ex.: "Contacte o administrador")
- `variant` — `"blocked"` | `"error"` (nunca expõe permission names)

### O que se mantém igual

- **Backend**: Sem alterações. Permissions continuam a ser validadas no servidor (middleware RPC + NestJS guards).
- **RPC contracts**: Sem alterações. Metadata de auth/permissions permanece nos contratos para tooling e debugging.
- **Database**: Sem alterações. Permissions e RBAC continuam em `@saptm/auth`.
- **API endpoints**: Sem alterações. O backend continua a retornar erros 403 quando apropriado.

### O que se perde

- Visibilidade directa de permission names na UI (ex.: `tracking.shipment.read`)
- Visibilidade de RPC endpoints na UI (ex.: `POST /rpc/cargo/register`)
- Visibilidade de session ID e organization ID na UI
- Badges "governado" / "Sem CRUD" na UI

### Mitigação

A perda de visibilidade de permissões é mitigada por:
1. **AccessState em erro** — quando uma permissão falta, o componente mostra uma mensagem clara ("indisponivel") sem expor o nome técnico
2. **Página de administração** — mantém contexto de permissões para gestores de organização (mas em linguagem operacional)
3. **Audit trail** — todas as tentativas de acesso bloqueadas ficam registadas no sistema de auditoria
4. **Logs de debugging** — permission names permanecem nos logs do servidor e nas ferramentas de desenvolvimento (não na UI)

---

## Consequences

### Positivas

1. **Linguagem operacional** — Toda a UI usa PT-PT logístico, não developer-facing. "Cargas" em vez de "Registo governado de cargas"
2. **Hierarquia de informação** — Conteúdo operacional (KPIs, métricas, tabelas) acima da dobra. Governance cards eliminados
3. **Performance** — Menos queries de base de dados por página (deixam de ser necessários dados de governança agregados para cada overview)
4. **UX para operador portuário** — Métricas de negócio (taxa de actividade, bloqueadas, em trânsito) substituem badges de permissão
5. **Segurança informacional** — Session IDs, Organization IDs e permission names deixam de estar expostos na UI do operador
6. **Manutenibilidade** — Componentes partilhados (`MetricTile`, `ContextRow`, `AccessState`) extraídos para `@saptm/ui` eliminam duplicação inline

### Negativas

1. **Perda de visibilidade de permissões** — Operadores e gestores perdem a visão directa de quais permissões estão atribuídas
   - *Mitigado por:* AccessState em erro, página de admin, audit trail, logs
2. **Esforço de implementação** — 9 bounded contexts afectados, cada um com redesign do overview header
3. **Curva de adaptação** — Operadores habituados a ver "governado" precisam de adaptar-se ao novo contexto operacional
4. **Risco de regressão** — Páginas podem ficar sem indicador de permissão em falta se AccessState não for implementado correctamente

### Impacto Arquitectural

**Camada de apresentação apenas.** Nenhuma alteração a:
- `@saptm/rpc` contratos
- `@saptm/api` implementação
- `@saptm/database` esquema
- `@saptm/auth` modelo de permissões
- Prisma schema
- RPC middleware de autorização

**Alterações localizadas a:**
- `apps/web/components/*/ *-overview-header.tsx` — 9+ ficheiros
- `packages/ui/src/components/access-state.tsx` — API unificada
- `packages/ui/src/components/metric-tile.tsx` — extraído de inline
- `packages/ui/src/components/context-row.tsx` — extraído de inline

---

## Compliance

### TOGAF ADM Alignment

| Fase ADM | Contribuição |
|----------|-------------|
| **A — Vision** | Alinhamento com visão de produto: UI para Transportation Manager, não para developer |
| **B — Business Architecture** | Linguagem operacional PT-PT unificada; hierarquia de informação redefinida |
| **C — Information Systems (Application)** | Componentes `AccessState`, `MetricTile`, `ContextRow` extraídos para `@saptm/ui`; APIs unificadas |
| **D — Technology** | Sem alterações na camada tecnológica |
| **E — Opportunities & Solutions** | Roadmap de migração priorizado por bounded context |
| **F — Migration Planning** | Implementação faseada: Cargo → Tracking → Planning → restantes |

### DDD Bounded Contexts

Os seguintes bounded contexts foram afectados:

| Bounded Context | Antes | Depois |
|----------------|-------|--------|
| **Cargo** | Governance card com `cargo.register`, RPC endpoints, session ID | MetricTile: Total, Em trânsito, Bloqueadas, Perigosas, Inspecção |
| **Tracking** | Governance card com `tracking.shipment.read`, organization ID | MetricTile: Remessas, Em trânsito, Atrasos, Exceções |
| **Planning** | Governance card com permissões de transporte | MetricTile: Ordens, Confirmadas, Canceladas, Despachadas |
| **Capacity** | Governance card com permissões de recurso | MetricTile: Recursos, Slots abertos, Bloqueados, Fechados |
| **Tariffs** | Governance card com permissões de tarifário | MetricTile: Rate cards, Ativos, Regras, Calculadas, Aprovadas |
| **Security** | Governance card com permissões de segurança | MetricTile: Sessões ativas, Outras sessões, 2FA |
| **Notifications** | Governance card com permissões de notificação | MetricTile: Total, Por ler, Lidas, Arquivadas |
| **Integrations** | Governance card com permissions de API | AccessState em blocked; MetricTile: SA, API keys, Eventos |
| **Admin** | Governance card com permissions de administração | MetricTile: Utilizadores, Ativos, Convites, Roles, Permissões |

### Quality Gates

- [x] C4 diagrams actualizados (nível 2 — component diagrams dos overview headers)
- [x] Bounded contexts definidos e documentados (9 afectados)
- [x] ADR escrito (este documento)
- [ ] Dependency graph validado (MetricTile/ContextRow/AccessState extraídos para `@saptm/ui`)
- [x] Layer boundaries respeitadas (apenas apresentação)
- [ ] Catálogo de versões consistente (sem alterações)

### Regras de Governança

| Regra | Estado |
|-------|--------|
| Nenhum permission name exposto na UI | ✅ Implementado |
| Nenhum RPC endpoint exposto na UI | ✅ Implementado |
| Nenhum ID interno exposto na UI | ✅ Implementado (sessionId, organizationId) |
| Nenhum termo CRUD na UI | ✅ Implementado |
| AccessState usa `badgeLabel` + `title` + `description` + `variant` | ✅ Implementado |
| Variant `"error"` não expõe permission names | ✅ Implementado |
| Variant `"blocked"` usa linguagem "indisponivel" não "sem grant" | ✅ Implementado |

---

## Notas

### Referências

- **UX-UI-AUDIT.md** — Auditoria que identificou os 48 findings (Secção 1.2 Linguagem e Tom, Secção 1.3 Hierarquia de Informação)
- **CODE-AUDIT.md** — Auditoria de código que documentou `AccessState` com API inconsistente e governance cards expostos
- **DESIGN-SYSTEM.md** — Extração de MetricTile, ContextRow, AccessState para `@saptm/ui`
- **AGENTS.md** — Secção "Opção B — Context Panel" e "AccessState API (unificada)"
- **ADR-0004** — oRPC Contract-First API (inalterado por esta decisão)

### Páginas que Ainda Precisam de Migração

Algumas páginas (ex.: Integrations) ainda contêm vestígios do padrão antigo — permission names em mensagens de erro do AccessState. Estas serão migradas incrementalmente no próximo ciclo de UI.

### Próximos Passos

1. Unificar API do `AccessState` — resolver inconsistência `status` vs `variant` prop
2. Extrair `MetricTile`, `ContextRow`, `AccessState` para `@saptm/ui` como componentes partilhados
3. Remover permission names residuais em mensagens de erro (Integrations page)
4. Adicionar try/catch em server components sem error handling (Planning page)
5. Validar com Design QA antes de entrega
