# Transport Planning Release Evidence

## Status

`fifth-business-module-p26-release-candidate`

## Operacoes

- `planning.overview.read`
- `planning.transport_order.confirm`
- `planning.transport_order.reschedule`
- `planning.transport_order.dispatch`
- `planning.transport_order.cancel`
- `GET /rpc/planning/overview`
- `POST /rpc/planning/confirmTransportOrder`
- `POST /rpc/planning/rescheduleTransportOrder`
- `POST /rpc/planning/dispatchTransportOrder`
- `POST /rpc/planning/cancelTransportOrder`
- `/app/planning`

## Acceptance Criteria

- tenant-scoped planning overview
- governed transport order confirmation
- idempotent transport order confirmation
- governed transport order reschedule
- idempotent transport order reschedule
- governed transport order dispatch
- idempotent transport order dispatch
- governed transport order cancellation
- idempotent transport order cancellation
- transport order confirmation requires ready sound cargo
- transport order confirmation requires customs clearance or not required
- transport order confirmation requires route with distinct origin and destination
- transport order confirmation requires responsible planner and carrier
- transport order confirmation requires confirmation before planned departure
- transport order confirmation links active capacity reservation when provided
- transport order confirmation links tenant tracking shipment when provided
- transport order confirmation blocks duplicate reference and duplicate cargo
- transport order cancellation requires confirmed state
- transport order cancellation requires timing before planned departure
- transport order cancellation requires operational reason and unique cancellation reference
- transport order cancellation blocks dispatched orders
- transport order cancellation emits capacity release and tracking notification signals when linked
- transport order reschedule requires confirmed state
- transport order reschedule requires timing before current and new planned departure
- transport order reschedule requires route change, responsible planner, reason, and unique revision reference
- transport order reschedule aligns active capacity reservation window when linked
- transport order reschedule blocks dispatched orders
- transport order reschedule emits downstream tracking notification signal when linked
- transport order dispatch requires confirmed state
- transport order dispatch requires timing after confirmation, after latest reschedule, and before planned departure
- transport order dispatch requires responsible operator, operational instructions, and unique dispatch reference
- transport order dispatch blocks duplicate order dispatch and duplicate dispatch reference
- transport order dispatch emits downstream tracking notification signal when linked
- planning audit and outbox for every critical mutation
- protected planning UI
- authenticated planning UI displays deterministic seeded transport order
- authenticated planning UI exposes governed reschedule command
- authenticated planning UI exposes governed dispatch command
- authenticated planning UI submits governed confirmation, reschedule, dispatch, and cancellation commands
- authenticated planning UI exposes governed cancellation command

## Security Evidence

- Read metadata requires `planning.order.read`.
- Confirmation metadata requires `planning.order.confirm`.
- Reschedule metadata requires `planning.order.reschedule`.
- Dispatch metadata requires `planning.order.dispatch`.
- Cancellation metadata requires `planning.order.cancel`.
- Mutation metadata requires idempotency.
- Router resolves organization from authenticated RPC context.
- Service reads cargo, tracking shipment, capacity reservation, and transport order by `organizationId`.

## Local Verification

- `pnpm --filter @saptm/rpc test`
- `pnpm --filter @saptm/api test`
- `pnpm --filter @saptm/web typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
