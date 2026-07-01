# SAPTM — Âmbito dos 4 Módulos Parciais (MVP 71% → 100%)

> **Departamento:** Product  
> **Data:** 2026-06-30  
> **Versão:** 1.0  
> **Objectivo:** Elevar o score MVP de **71% (10/14)** para **100% (14/14)** dando a cada módulo parcial uma página de overview dedicada, com painel de contexto próprio, usando **apenas** RPCs e formulários já existentes.

---

## Decisão de Produto

**GO** — Implementar as 4 páginas de overview descritas abaixo.

### Justificação
- Os 4 módulos (Compliance, Dispatch, Exception Management, Delivery) já existem como sub-funcionalidades embebidas noutras páginas, mas **não têm descoberta, KPIs autónomos nem estado vazio acionável**.
- Criar uma página dedicada por módulo não exige novo backend: todos os dados e ações necessários já estão disponíveis via `@saptm/rpc`.
- Alinha-se às necessidades das personas validadas (Carlos, Marta, Rui) e ao pattern **Opção B — Context Panel** definido no design system.

### Impacto Estimado
- **Retenção / eficiência:** reduzir o tempo de descoberta de documentos pendentes, ordens por despachar, exceções activas e entregas pendentes.
- **Cobertura MVP:** passa de 10/14 para 14/14 módulos completos.
- **Esforço:** baixo — apenas composição de UI com dados existentes; zero alteração de regras de negócio.

---

## Restrições Globais

1. **Sem novo backend** — não se criam novos modelos, queries, mutações, routers nem RPCs.
2. **Apenas reuse** — todas as tabelas, KPIs e acções usam contratos e formulários existentes.
3. **Opção B — Context Panel** — cada página tem um card de contexto operacional com `MetricTile`(s) e `ContextRow`(s); nenhum card expõe nomes de permissões, IDs técnicos ou endpoints.
4. **Linguagem PT-PT operacional** — nada de termos developer-facing na UI (ex.: `planning.order.dispatch`, `cargoId`, `RBAC`).
5. **Padrão de páginas existente** — RSC `page.tsx`, `loading.tsx`, `error.tsx`, `AccessState` para permissões e `ErrorCard` para erros de RPC.

---

## Nota de Navegação

Adicionar entradas em `apps/web/lib/platform-navigation.ts` no grupo **Operações**:

- `Compliance` → `/app/compliance` (requer `cargo.read`)
- `Despacho` → `/app/dispatch` (requer `planning.order.read`)
- `Exceções` → `/app/exceptions` (requer `tracking.shipment.read`)
- `Entregas` → `/app/delivery` (requer `cargo.read`)

---

## 1. Compliance

### Business purpose
Consolidar, num único ecrã, todas as evidências documentais de compliance para que o operador saiba o que está pendente, aprovado, rejeitado ou expirado antes da carga partir.

### Primary persona
**Carlos Andrade** — Operador de Cargas

### Page route
`/app/compliance`

### Permission required
- **Leitura:** `cargo.read`
- **Registo:** `cargo.compliance.record`
- **Verificação:** `cargo.compliance.verify`

### Must-have sections

#### Context panel KPIs (5 `MetricTile`s)
1. **Total de evidências** — total de documentos registados.
2. **Pendentes** — evidências com estado `pending_review`.
3. **Aprovadas** — evidências com estado `approved`.
4. **Rejeitadas** — evidências com estado `rejected`.
5. **Expiradas** — evidências com `expiresAt` anterior a agora (cálculo client-side).

#### Contexto operacional (`ContextRow`s)
- Taxa de aprovação = `approved / total`.
- Documentos pendentes por tipo de evidência (agregação client-side).
- Rejeições sem resolução.

#### Table / list of items
Lista de evidências via `document.list`.

| Coluna | Descrição |
|--------|-----------|
| Documento | `documentTitle` + `documentReference` |
| Tipo | label operacional de `evidenceType` (ex.: «Declaração aduaneira») |
| Carga | `cargoReference` resolvido a partir de `cargo.overview.read`; se indisponível, «Carga não carregada» |
| Estado | badge de `validationStatus` (Pendente / Aprovada / Rejeitada) |
| Validade | `expiresAt` formatado; destaque se expirado |
| Ação | link «Verificar» (se pendente e permissão) ou «Abrir carga» → `/app/cargo` |

#### Empty state with CTA
- Título: «Nenhuma evidência de compliance registada»
- Descrição: «Registe a primeira evidência a partir da ficha de carga.»
- CTA primário: **«Registar primeira evidência»** → `/app/cargo#cargo-compliance-evidence`

#### Link to existing form / action
- **Registo:** link para a secção `cargo-compliance-evidence` da página Cargas.
- **Verificação:** reutilizar o formulário `CargoComplianceEvidenceVerifyForm` com o `evidenceId` pré-preenchido ao clicar na acção da linha (sem alterar o schema RPC).

### Existing RPCs / forms to reuse
- **Queries:**
  - `document.list` (`GET /documents/list`) — lista paginada de evidências.
  - `cargo.overview.read` (`GET /cargo/overview`) — mapeamento `cargoId` → `cargoReference`.
- **Mutations / forms:**
  - `cargo.compliance.evidence.record` + `CargoComplianceEvidenceRecordForm`
  - `cargo.compliance.evidence.verify` + `CargoComplianceEvidenceVerifyForm`

### Out of scope
- Novo serviço de upload de documentos.
- Novo alerta automático de documentos a expirar.
- Integração directa com alfândega na UI (mantém-se via Integration Gateway).
- Acções em massa (aprovar/rejeitar múltiplas evidências).
- Export CSV (pode ser feito via `/app/reports`).
- Criação de uma permissão `compliance.read` dedicada.

---

## 2. Dispatch

### Business purpose
Dar visibilidade consolidada às transport orders confirmadas, já despachadas e pendentes de despacho, para que a planeadora as entregue à operação no momento certo.

### Primary persona
**Marta Sousa** — Planeadora de Transportes

### Page route
`/app/dispatch`

### Permission required
- **Leitura:** `planning.order.read`
- **Despacho:** `planning.order.dispatch`

### Must-have sections

#### Context panel KPIs (5 `MetricTile`s)
1. **Total de ordens** — `totals.transportOrders`.
2. **Confirmadas** — `totals.confirmed`.
3. **Despachadas** — `totals.dispatched`.
4. **Por despachar** — `confirmed - dispatched`.
5. **Partidas futuras** — `totals.upcomingDepartures`.

#### Contexto operacional (`ContextRow`s)
- Taxa de dispatch = `dispatched / confirmed`.
- Taxa de confirmação = `confirmed / total`.
- Ordens canceladas.

#### Table / list of items
Lista de ordens via `planning.overview.read`, filtradas client-side por estado de dispatch.

| Coluna | Descrição |
|--------|-----------|
| Ordem | `orderReference` + modo e transportador |
| Carga | `cargoReference` + `cargoDescription` |
| Rota | `originName` → `destinationName` |
| Janela | partida / chegada planeada formatadas |
| Estado | badge «Confirmada», «Despachada» ou «Cancelada» |
| Ação | botão/link **«Despachar»** para ordens confirmadas sem dispatch; para já despachadas, indicador «Já despachada» |

#### Empty state with CTA
- Título: «Nenhuma ordem de transporte para despachar»
- Descrição: «Confirme uma ordem no planeamento antes de a entregar à operação.»
- CTA primário: **«Ir para Planeamento»** → `/app/planning`

#### Link to existing form / action
- Reutilizar o formulário `TransportOrderDispatchForm` embebido na própria página, pré-preenchendo o `orderId` quando o utilizador clica em **«Despachar»** numa linha.
- Alternativa (se prefere link): redireccionar para `/app/planning` onde o mesmo formulário já existe.

### Existing RPCs / forms to reuse
- **Queries:**
  - `planning.overview.read` (`GET /planning/overview`) — totais e `recentOrders`.
- **Mutations / forms:**
  - `planning.transport_order.dispatch` + `TransportOrderDispatchForm`

### Out of scope
- Novo dashboard por operador/turno.
- Notificações de dispatch urgente.
- Métricas de tempo médio entre confirmação e dispatch.
- Alteração à regra de negócio que impede re-dispatch.
- Criação de uma permissão `dispatch.read` dedicada.

---

## 3. Exception Management

### Business purpose
Centralizar a visão das exceções operacionais activas (atrasos, holds, exceções de tracking) para que o gestor de operações priorize a resolução e acompanhe o estado do workflow.

### Primary persona
**Rui Mendes** — Gestor de Operações

### Page route
`/app/exceptions`

### Permission required
- **Leitura:** `tracking.shipment.read`
- **Gestão:** `tracking.exception.manage`
- **Resolução:** `tracking.exception.resolve`

### Must-have sections

#### Context panel KPIs (5 `MetricTile`s)
1. **Exceções activas** — `kpis.exceptionShipments` (de `tracking.analytics.read`).
2. **Remessas atrasadas** — `kpis.delayedShipments`.
3. **Críticas <24h** — `slaRisk.dueWithin24Hours`.
4. **Fora de SLA** — `slaRisk.overdueShipments`.
5. **Resolvidas no período** — `kpis.completedShipments` (proxy de resolução no lookback).

#### Contexto operacional (`ContextRow`s)
- Taxa de excepção = `exceptionShipments / totalShipments`.
- Workflow states (ex.: «Abertas», «Pendentes de revisão», «Aprovadas para resolução», «Fechadas») via `workflowStateCounts`.
- Modais de transporte mais afectados via `modeDistribution`.

#### Table / list of items
Lista de remessas em excepção/atraso via `tracking.overview.read`, filtrando `status` = `exception` ou `delayed`.

| Coluna | Descrição |
|--------|-----------|
| Remessa | `referenceCode` |
| Carga | `cargoDescription` |
| Rota | `originName` → `destinationName` |
| Estado | badge `status` (Excepção / Atrasada) |
| Último evento | label de `lastEventType` + `lastKnownLocation` |
| Prioridade | `priority` |
| Ação | link **«Gerir / Resolver»** → `/app/tracking/[shipmentId]` |

#### Empty state with CTA
- Título: «Nenhuma excepção operacional activa»
- Descrição: «Acompanhe as remessas em tracking para detectar atrasos ou holds.»
- CTA primário: **«Ir para Tracking»** → `/app/tracking`

#### Link to existing form / action
- Cada linha liga para a página de detalhe da remessa (`/app/tracking/[shipmentId]`) onde já existem os formulários:
  - `TrackingExceptionManageForm`
  - `TrackingExceptionResolveForm`

### Existing RPCs / forms to reuse
- **Queries:**
  - `tracking.overview.read` (`GET /tracking/overview`) — lista de remessas.
  - `tracking.analytics.read` (`GET /tracking/analytics`) — KPIs agregados e workflow states.
- **Mutations / forms:**
  - `tracking.exception.manage` + `TrackingExceptionManageForm`
  - `tracking.exception.resolve` + `TrackingExceptionResolveForm`

### Out of scope
- Lista unificada de exceções de carga (`cargo.delivery.exception`) — mantêm-se na página Cargas.
- Notificações em tempo real de novas excepções.
- SLA timer por excepção.
- Resolução automática ou recomendações de IA (advisory de tracking não existe).
- Criação de uma permissão `exception.read` dedicada.

---

## 4. Delivery

### Business purpose
Oferecer uma visão consolidada das cargas prontas para entrega, entregues e com excepções de entrega, para que o operador registe a conclusão ou o problema sem perder tempo entre módulos.

### Primary persona
**Carlos Andrade** — Operador de Cargas

### Page route
`/app/delivery`

### Permission required
- **Leitura:** `cargo.read`
- **Concluir entrega:** `cargo.delivery.complete`
- **Registar excepção:** `cargo.delivery.exception.record`
- **Resolver excepção:** `cargo.delivery.exception.resolve`

### Must-have sections

#### Context panel KPIs (5 `MetricTile`s)
1. **Total de cargas** — `totals.cargo`.
2. **Em trânsito** — `totals.activeCargo`.
3. **Chegadas** — contagem de cargas com `status = in_transport` ou `arrived` (client-side).
4. **Entregues** — contagem de cargas com `status = delivered`.
5. **Com excepção** — contagem de cargas com `conditionStatus` = `damaged` ou `requires_inspection`.

#### Contexto operacional (`ContextRow`s)
- Taxa de entrega = `delivered / total`.
- Cargas a aguardar entrega (chegadas mas não entregues).
- Cargas com inspecção pendente.

#### Table / list of items
Lista de cargas via `cargo.overview.read`, filtrando status relevantes para entrega.

| Coluna | Descrição |
|--------|-----------|
| Referência | `cargoReference` |
| Destino | `destinationName` |
| Estado | badge `status` (ex.: «Chegada», «Em trânsito», «Entregue») |
| Condição | badge `conditionStatus` |
| Ação | link **«Concluir entrega»** ou **«Registar excepção»** → `/app/cargo` |

#### Empty state with CTA
- Título: «Nenhuma carga disponível para entrega»
- Descrição: «Registe ou acompanhe uma carga para concluir a entrega.»
- CTA primário: **«Ir para Cargas»** → `/app/cargo`

#### Link to existing form / action
- As acções da tabela redireccionam para a página Cargas, onde já existem:
  - `CargoDeliveryCompleteForm`
  - `CargoDeliveryExceptionRecordForm`
  - `CargoDeliveryExceptionResolveForm`

### Existing RPCs / forms to reuse
- **Queries:**
  - `cargo.overview.read` (`GET /cargo/overview`) — totais, `statusCounts` e `recentCargo`.
- **Mutations / forms:**
  - `cargo.delivery.complete` + `CargoDeliveryCompleteForm`
  - `cargo.delivery.exception.record` + `CargoDeliveryExceptionRecordForm`
  - `cargo.delivery.exception.resolve` + `CargoDeliveryExceptionResolveForm`

### Out of scope
- Assinatura digital ou proof of delivery.
- Novo campo de foto/comprovativo de entrega.
- Cálculo de entregas no prazo vs atrasadas (não há campo de delivery deadline).
- Agendamento de entregas.
- Criação de uma permissão `delivery.read` dedicada.

---

## Dependências e Riscos

| # | Dependência / Risco | Mitigação |
|---|---------------------|-----------|
| 1 | `document.list` ainda não tem hook/wrapper na app web | Criar `lib/documents-list.ts` e `hooks/use-documents-list.ts` seguindo o padrão de `lib/cargo-overview.ts`. |
| 2 | `cargo.overview.read` só devolve `recentCargo` (até 50 itens); o mapeamento `cargoId` → `cargoReference` na Compliance pode ser parcial | Aceitar como limitação MVP; na UI mostrar «Carga não carregada» quando o mapeamento falhar. |
| 3 | Formulários existentes não aceitam props de valor pré-preenchido | Passar `defaultValue` nos inputs controlados ou usar query params para pré-selecção. |
| 4 | Navegação sidebar deve reflectir as novas páginas | Actualizar `platformNavigation` e validar permissões. |
| 5 | Design QA obrigatório antes de entrega | Executar `@enterprise-design-qa` sobre as 4 novas páginas. |

---

## Checklist de Quality Gates

- [ ] Problema validado com research (personas existentes).
- [ ] Hipótese com métrica: redução do tempo para encontrar itens pendentes.
- [ ] User story escrita por módulo (ver secções acima).
- [ ] Protótipo de baixa fidelidade pode reaproveitar os wireframes de `/app/cargo`, `/app/planning`, `/app/tracking`.
- [ ] Impacto vs esforço documentado (baixo esforço, alto impacto em cobertura MVP).
- [ ] Feature flag implícita via RBAC/permissions.
- [ ] Métricas de sucesso: tempo até acção e taxa de páginas vazias com CTA clicado.

---

*Documento produzido pelo departamento de **Product**. Baseado em `audit/PRODUCT-AUDIT.md`, `docs/product/personas.md` e nos contratos RPC de `@saptm/rpc`.*
