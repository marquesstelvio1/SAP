# Transport Planning

## Objetivo

Confirmar Transport Orders tenant-scoped para cargas ferroviarias, portuarias e logisticas sem criar CRUD generico. A ordem liga carga, rota, planner, carrier, janela operacional, tracking opcional e reserva de capacidade opcional.

## Escopo P26

- `GET /rpc/planning/overview` le ordens de transporte por tenant com totais, links de capacidade e tracking.
- `POST /rpc/planning/confirmTransportOrder` confirma ordem governada com idempotencia obrigatoria.
- `POST /rpc/planning/rescheduleTransportOrder` replaneia ordem confirmada com revisao auditavel.
- `POST /rpc/planning/dispatchTransportOrder` despacha ordem confirmada para execucao operacional com idempotencia obrigatoria.
- `POST /rpc/planning/cancelTransportOrder` cancela ordem confirmada com idempotencia obrigatoria.
- `/app/planning` mostra overview protegido, regras aplicadas e formularios de confirmacao, replaneamento, dispatch e cancelamento.

## Regras de Negocio

- A carga deve estar `ready_for_transport`.
- A carga deve estar com customs `cleared` ou `not_required`.
- A carga deve estar em condicao `sound`.
- Origem e destino devem ser distintos.
- A rota deve ter resumo operacional.
- O planner responsavel e o carrier devem ser informados.
- A confirmacao deve ocorrer antes da partida planeada.
- A chegada planeada deve ser posterior a partida planeada.
- Se uma reserva de capacidade for informada, ela deve estar `reserved`, pertencer a mesma carga e a partida deve cair na janela do slot.
- Se um shipment de tracking for informado, ele deve pertencer ao tenant e estar vinculado a carga.
- A referencia da ordem, a carga e a idempotency key nao podem gerar duplicidade.
- Cancelamento exige ordem em estado `confirmed`.
- Cancelamento deve ocorrer depois da confirmacao e antes da partida planeada.
- Cancelamento exige responsavel, motivo operacional e referencia unica por tenant.
- Cancelamento e bloqueado quando a ordem ja possui dispatch operacional.
- Cancelamento nao executa automaticamente liberacao de capacidade nem tracking; ele sinaliza esses impactos via outbox.
- Replaneamento exige ordem em estado `confirmed`.
- Replaneamento deve ocorrer depois da confirmacao e antes da partida atual e da nova partida.
- Replaneamento exige mudanca real de rota, modo, carrier ou janela.
- Replaneamento exige responsavel, motivo operacional e referencia de revisao unica por tenant.
- Replaneamento deve manter nova partida dentro da janela de capacidade quando ha reserva ligada.
- Replaneamento e bloqueado quando a ordem ja possui dispatch operacional.
- Replaneamento nao atualiza tracking automaticamente; ele sinaliza notificacao downstream via outbox.
- Dispatch exige ordem em estado `confirmed`.
- Dispatch deve ocorrer depois da confirmacao, depois do ultimo replaneamento quando existir, e antes da partida planeada.
- Dispatch exige responsavel, instrucoes operacionais e referencia unica por tenant.
- Dispatch bloqueia duplicidade por ordem, referencia e idempotency key.
- Dispatch exige reserva de capacidade `reserved` e alinhada a janela quando ha reserva ligada.
- Dispatch nao atualiza tracking automaticamente; ele sinaliza notificacao downstream via outbox.

## Seguranca

- Leitura exige `planning.order.read`.
- Confirmacao exige `planning.order.confirm`.
- Cancelamento exige `planning.order.cancel`.
- Replaneamento exige `planning.order.reschedule`.
- Dispatch exige `planning.order.dispatch`.
- Todas as chamadas exigem sessao Better Auth com organizacao resolvida.
- O backend aplica tenant scope em carga, tracking, capacidade e ordem.

## Evidencia Local

- Contrato RPC: `packages/rpc/tests/planning.test.mjs`.
- Router API: `apps/api/tests/planning-rpc.test.mjs`.
- Backend: `apps/api/src/planning/planning.service.ts`.
- UI: `apps/web/app/(platform)/app/planning/page.tsx`.
- UI replaneamento: `apps/web/components/transport-order-reschedule-form.tsx`.
- UI dispatch: `apps/web/components/transport-order-dispatch-form.tsx`.
- UI cancelamento: `apps/web/components/transport-order-cancel-form.tsx`.
- Seed demo: `packages/database/prisma/seed.ts`.
- E2E autenticado: `tests/e2e/authenticated-platform.spec.ts`.
