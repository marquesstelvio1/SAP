# Tariff / Pricing

## Scope

P10 implements governed tariff/pricing foundations for the logistics SaaS platform.

The module supports:

- Tenant-scoped tariff overview.
- governed tariff rate card registration.
- idempotent tariff rate card registration.
- governed tariff rate rule addition.
- idempotent tariff rate rule addition.
- governed tariff quote calculation.
- idempotent tariff quote calculation.
- tax model calculation for governed tariff quotes.
- governed tariff quote approval.
- idempotent tariff quote approval.
- protected Tariff / Pricing UI at `/app/tariffs`.

## Business Rules

### Rate Card

- Rate card codes are unique per organization.
- Currency codes are normalized to uppercase ISO-style three-letter codes.
- Validity windows must have `validUntil` after `validFrom` when an end date exists.
- Registration is idempotent per organization.
- Every registration writes audit and outbox evidence.

### Rate Rule

- Rate rules are scoped to one tenant and one rate card.
- Rule codes are unique per rate card.
- Retired rate cards cannot receive new rules.
- Rule effective windows must sit inside the parent rate card validity window.
- `flat` rules require `flatAmount`.
- `percentage` rules require `percentageRate`.
- Unit-based rules require `unitRate`.
- Optional origin, destination, and cargo type filters restrict applicability.
- Every rule mutation writes audit and outbox evidence.

### Quote Calculation

- Cargo must belong to the current tenant.
- Cancelled or delivered cargo cannot be quoted.
- The rate card must be active and valid at calculation time.
- At least one applicable rule must match the cargo and calculation time.
- Required metrics must exist for the selected basis: unit count, weight, volume, or distance.
- Quote references are unique per organization.
- Calculation is idempotent per organization.
- Optional quote tax rate must be between 0 and 100 percent.
- Quote calculation stores taxable amount, tax rate, tax amount, and final total in the audit payload.
- Quote calculation never approves the quote automatically.
- Every calculation writes audit and outbox evidence.

### Quote Approval

- Only calculated quotes can be approved.
- Approval timestamp must be after calculation timestamp.
- Approval reference, approver, and notes are mandatory.
- Approval is idempotent per organization.
- Every approval writes audit and outbox evidence.

## Security

- `tariff.read` reads overview, rate cards, and quote history.
- `tariff.manage` registers rate cards and adds rate rules.
- `tariff.quote.calculate` calculates governed quotes.
- `tariff.quote.approve` approves calculated quotes.
- Backend authorization resolves session, organization, and permission before every operation.
- Frontend actions call the backend RPC layer and never write directly to the database.

## Contracts

- `tariff.overview.read` via `GET /rpc/tariff/overview`.
- `tariff.rate_card.register` via `POST /rpc/tariff/registerRateCard`.
- `tariff.rate_rule.add` via `POST /rpc/tariff/addRateRule`.
- `tariff.quote.calculate` via `POST /rpc/tariff/calculateQuote`.
- `tariff.quote.approve` via `POST /rpc/tariff/approveQuote`.

## Acceptance Criteria

- `pnpm validate:tariff-foundation` passes.
- `pnpm test` includes RPC and API router coverage for Tariff / Pricing.
- `pnpm test:e2e` validates anonymous route protection for `/app/tariffs` and authenticated
  governed quote calculation through the UI.
- `pnpm build` includes `/app/tariffs`.
- Release evidence includes Tariff / Pricing as the fourth business module candidate.

## Next Slice

The next pricing slice can extend this foundation with contract customer tariffs, carrier
settlement integration, or optimization recommendations. No autonomous pricing approval should be
introduced without human approval evidence.
