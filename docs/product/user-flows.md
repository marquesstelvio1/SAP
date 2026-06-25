# SAPTM User Flows

## 1. Onboarding Flow

**Actors:** New user, System, Administrator (inviter)

**Trigger:** User navigates to `sign-up` or receives invitation email.

### Steps

1. User lands on `/` or clicks invitation link in email.
2. User completes `sign-up` form: name, email, password (min 12 chars).
3. System sends verification email; user clicks verification link.
4. **Decision:** User was invited — accept invitation and join existing org. User signed up independently — create new organization.
5. If new org: user enters organization name, slug; system provisions tenant.
6. User lands on platform dashboard at `/(platform)/app/`.
7. System displays readiness checklist: tenant resolved, RBAC active, email verified.

### Decision Points

- **Email already registered** → prompt sign-in or password reset.
- **Invitation expired** → show expired link state with "request new invitation" action.
- **Password policy violation** → inline validation on min 12 / max 128 characters.

### Error States

| Error | UX Response |
|-------|-------------|
| Email taken | Show "account already exists" with sign-in link |
| Invalid invitation token | Show "invitation not found" with contact-admin instruction |
| Organization slug taken | Inline error on slug field |
| Verification email fails | Show "resend verification" button, retry with backoff |

### Success Criteria

- User has active session with verified email.
- User has resolved organization context.
- User sees platform dashboard with their granted permissions reflected.

---

## 2. Cargo Management Flow

**Actors:** Logistics Operator, System, Operations Manager

**Trigger:** Operator needs to register incoming cargo for transport planning.

### Steps

1. Operator navigates to `/app/cargo`, views cargo overview (`cargo.overview.read`).
2. Operator clicks "Register Cargo", fills form: cargo reference, description, type (container/bulk/hazardous/etc), gross weight, package count, shipper, consignee, origin, destination, custody owner, customs status, condition, hazardous fields.
3. System validates: reference unique per tenant, hazardous rules, customs rules, condition rules.
4. **Decision:** Cargo registered with blockers? → if `held` (customs held, damaged, inspection required), status is `held`; else `registered`.
5. Operator views cargo detail, sees business rules: `movementBlocked`, `inspectionRequired`, `customsBlocked`.
6. If customs held: Operator records compliance evidence (`cargo.compliance.evidence.record`), then approves it (`cargo.compliance.evidence.verify`).
7. Operator releases cargo (`cargo.release`): sets customs cleared, inspection passed. Status → `ready_for_transport`.
8. Operator plans transport (`cargo.transport.plan`): selects transport mode (rail/port/road/multimodal), planned departure, ETA, operations owner team. System creates tracking shipment.
9. Operator records compliance evidence (bill of lading, customs declaration, etc). Evidence must be approved before departure.
10. Operator departs cargo (`cargo.transport.depart`): sets departure location, operator name. Status → `in_transport`. Tracking shipment → `in_transit`.
11. During transit: Operator records operational handoffs (`cargo.handoff.record`) for custody transfers (rail-to-port, terminal-to-carrier, etc).
12. Cargo arrives (`cargo.transport.arrive`): sets arrival location. Tracking → `arrived`.
13. Delivery complete (`cargo.delivery.complete`): receiver signs, condition recorded. Status → `delivered`. Tracking → `completed`.

### Decision Points

- **Hazardous cargo** → requires UN number, hazard class, inspection flag.
- **Customs held** → requires customs reference, cleared before release.
- **Damaged condition** → inspection required before release.
- **Non-sound delivery** → must go through exception flow (not direct delivery complete).

### Error States

| Error | UX Response |
|-------|-------------|
| Duplicate cargo reference | Inline validation on cargo reference field |
| Depart without approved evidence | Block with list of missing compliance docs |
| Arrive before departure | "Invalid sequence" toast with timeline guidance |
| Non-sound delivery attempted | Redirect to exception recording flow |

### Success Criteria

- Cargo reaches `delivered` status with complete event timeline.
- All compliance evidence recorded and approved.
- Audit trail captures every state transition.

---

## 3. Exception Handling Flow

**Actors:** Logistics Operator, Operations Manager, System

**Trigger:** Delivery cannot be completed due to damage, shortage, temperature excursion, documentation mismatch, or security seal breach.

### Steps

1. Operator attempts delivery but condition is non-sound. System blocks `cargo.delivery.complete`.
2. Operator records delivery exception (`cargo.delivery.exception.record`): exception type, condition status (damaged/requires_inspection), summary, evidence reference, optional claim reference.
3. System transitions: cargo → `held`, shipment → `exception`, creates tracking `exception` event.
4. **Decision:** Exception has claim reference? → flag for claims settlement.
5. Operations Manager investigates: reviews evidence, inspects cargo, determines resolution.
6. Manager resolves exception (`cargo.delivery.exception.resolve`): resolution code (inspection_passed/claim_accepted/waiver_approved/recovered/other), resolution reference, summary. Final condition restored to `sound`.
7. System transitions: cargo → `in_transport`, shipment → `arrived`, creates tracking `released` event.
8. **Decision:** Resolution code is `claim_accepted`? → proceed to claims settlement.
9. If claim: Manager records claim settlement (`cargo.claim.settle`): settlement type (carrier_liability/insurance_recovery/etc), currency, amount, counterparty.
10. Delivery can now be completed normally.

### Decision Points

- **Claim reference present** → exception requires associated claim settlement.
- **Resolution code** determines subsequent workflow (inspection_passed → no claim; claim_accepted → settlement required).
- **Duplicate exception** blocked if open exception already exists for cargo.

### Error States

| Error | UX Response |
|-------|-------------|
| Duplicate open exception | "Open exception exists for this cargo" toast |
| Resolution without open exception | "No open exception found" error |
| Settlement without claim_accepted | "Exception not resolved as claim-accepted" block |
| Duplicate settlement reference | "Settlement reference already used" inline error |

### Success Criteria

- Exception resolved with final condition `sound`.
- Claim settlement recorded (if applicable).
- Cargo restored to deliverable state.
- Full audit trail: exception recorded → resolved → settlement.

---

## 4. Capacity Booking Flow

**Actors:** Operations Manager, Logistics Operator, System

**Trigger:** Operator needs to reserve infrastructure capacity (terminal gate, berth, rail track, yard, carrier slot) for cargo handling.

### Steps

1. Manager navigates to `/app/capacity`, views capacity overview: resources, open/blocked/closed slots, active reservations.
2. If needed, Manager registers a new resource (`capacity.resource.register`): resource type (terminal/gate/berth/rail_track/yard/carrier_slot), code, name, location, max concurrent bookings.
3. Manager opens a slot (`capacity.slot.open`): select resource, slot reference, window start/end, capacity units.
4. System validates: window end after start, capacity within resource limit, unique reference.
5. Operator views available slots, selects one for their cargo.
6. Operator reserves slot (`capacity.slot.reserve`): select cargo, reservation reference, purpose (handoff/departure/arrival/delivery/storage), reserved units.
7. System validates: cargo eligible, slot open, capacity available, no duplicate reservation.
8. **Decision:** Slot advisory recommends review? → advisory decision workflow.
9. System displays capacity advisory recommendations (`capacity.optimization.advisory.read`): slot saturation, expiring slots, unused capacity, reservation imbalance.
10. Manager reviews advisories, records decision (`capacity.advisory.decision.record`): approve or reject with reason and approval reference.
11. **Decision:** Cancel reservation? → Operator cancels (`capacity.slot.cancel`): cancellation reference, reason, timestamp. Units return to pool.

### Decision Points

- **Advisory triggered** → human approval required before or after reservation.
- **Capacity insufficient** → show alternative slots or suggest opening new slots.
- **Cancellation review** advisory → manager evaluates whether to approve cancellation.

### Error States

| Error | UX Response |
|-------|-------------|
| No available units | "Capacity full" with advisory view link |
| Window expired | "Slot window has closed" toast |
| Invalid reservation purpose | Inline validation |
| Duplicate cargo-slot reservation | "Cargo already reserved for this slot" |

### Success Criteria

- Slot reserved and linked to cargo.
- Capacity utilization tracked in overview.
- Advisory decisions recorded with audit trail.
- Cancellation releases capacity back to pool.

---

## 5. Admin Flow

**Actors:** Administrator, System, Invited User

**Trigger:** Administrator needs to onboard team members or manage access.

### Steps

1. Admin navigates to `/app/admin`, views admin overview: organization status, user list, roles, permissions, security model.
2. Admin invites user (`admin.user.invite`): email, name, optional role keys.
3. System creates membership with `invited` status, sends invitation email with accept URL.
4. **Decision:** Invitation accepted? → user joins org. Expired? → Admin can resend or cancel.
5. Admin assigns role (`admin.role.assign`): select membership, select role.
6. **Decision:** Need custom role? → Admin creates role.
7. Admin creates role (`admin.role.create`): key, name, description, permission keys from platform permission catalog.
8. Admin updates role permissions (`admin.role.permissions.update`): modify granted permissions.
9. Admin reviews audit trail (`audit.records.search`): filter by action, user, date range. Export for compliance (`audit.records.export`).
10. **Decision:** User leaves or needs removal? → Admin updates membership status (`admin.membership.status.update`): active/suspended/removed with reason.
11. Admin revokes role (`admin.role.revoke`): removes specific role from member.

### Decision Points

- **Role assignment** → permissions evaluated in `ALL` or `ANY` mode per RPC contract.
- **Custom role creation** → requires both `tenant.manage` and `identity.role.assign` permissions.
- **Membership suspension** → immediate effect; all sessions for that user invalidated.

### Error States

| Error | UX Response |
|-------|-------------|
| Email already member | "User already belongs to organization" toast |
| Role key conflict | "Role key must be unique" inline error |
| Invalid permission combination | "Selected permissions conflict" with details |
| Cannot delete protected role | "Role is protected and cannot be deleted" |

### Success Criteria

- User invited, accepted, and assigned roles with correct permissions.
- Audit log captures all admin actions with subject, action, and timestamp.
- Custom roles created with exact permission set required.
- Membership lifecycle managed (invite → active → suspended/removed).
