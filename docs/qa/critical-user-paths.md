# SAPTM Critical User Paths — E2E Coverage

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Owner:** QA Agent

---

## 1. Path Inventory

| # | Path | E2E Coverage | Status |
|---|---|---|---|
| P01 | New user sign-up and onboarding | Partial (invitation accept in `authenticated-platform`) | Implemented |
| P02 | Cargo registration through delivery | Full (`mvp-complete-journey`, 14-step) | Implemented |
| P03 | Exception handling workflow | Full (`mvp-complete-journey`, record + resolve) | Implemented |
| P04 | Capacity slot booking | Full (`mvp-complete-journey`, reserve) | Implemented |
| P05 | Admin user management (invite + role assign) | Full (`authenticated-platform`, identity commands) | Implemented |
| P06 | Report generation and export | Full (`authenticated-platform`, `mvp-complete-journey`) | Implemented |
| P07 | 2FA setup and login | Not covered | **Missing** |
| P08 | Integration adapters (Port TOS, Rail TMS, etc.) | Full (`authenticated-platform`, 6 adapters) | Implemented |
| P09 | Audit trail search and filter | Full (`authenticated-platform`) | Implemented |
| P10 | Transport planning lifecycle (confirm → reschedule → cancel → dispatch) | Full (`authenticated-platform`) | Implemented |

---

## 2. Detailed Path Specifications

### P01 — New User Sign-Up and Onboarding

**Coverage:** Partial — only invitation-based acceptance path.

**Steps:**
1. Admin invites user via `/app/admin` → "Convidar utilizador" form
2. System generates invitation with token link
3. New user opens invitation link at `/accept-invitation?token=...`
4. User fills: Nome completo, Password, Confirmar password
5. User clicks "Aceitar convite"
6. System validates token, creates user, activates membership
7. User is redirected to sign-in
8. User signs in with new credentials
9. System grants role-based access per invitation configuration

**Data requirements:** Unique email, valid invitation token, password meeting policy (12-128 chars)

**Expected outcomes:** User created, membership active, roles assigned, audit event recorded, outbox notification sent

**Edge cases:**
- Expired token → "Convite indisponivel" error page
- Token reuse → idempotency handling
- Weak password → validation rejection
- Duplicate email → error with user feedback
- Invitation for already-existing user → role assignment only

---

### P02 — Cargo Registration Through Delivery

**Coverage:** Full — `mvp-complete-journey.spec.ts` covers all 14 steps.

**Steps:**
1. Sign in as admin operator
2. Navigate to `/app/cargo`
3. Fill cargo form: reference, type, weight, volumes, shipper, consignee, origin, destination
4. Submit "Registar carga"
5. Verify success toast: "Carga registada com regras de negocio, audit trail e outbox"
6. Record compliance evidence (bill of lading)
7. Verify compliance evidence as approved
8. Release cargo for transport
9. Create transport plan / tracking
10. Reserve capacity slot at `/app/capacity`
11. Confirm and dispatch transport order at `/app/planning`
12. Execute departure at `/app/cargo`
13. Verify tracking status "Em transito" at `/app/tracking`
14. Execute arrival and delivery completion
15. Verify audit events at `/app/audit`

**Data requirements:**
- Unique cargo reference (CGO-MVP-{timestamp}{random})
- Valid capacity slot ID (`local_demo_capacity_slot_open_001`)
- Valid seeded shipment references for tracking

**Expected outcomes:** Cargo lifecycle: registered → evidence recorded → evidence verified → released → departure → in_transit → arrived → delivered. Audit trail populated. Notifications generated.

**Edge cases:**
- Registration with duplicate reference → error
- Release without compliance evidence → business rule rejection (`movement_blocked_until_governed_release`)
- Departure without transport plan → rejection
- Delivery without arrival → rejection

---

### P03 — Exception Handling Workflow

**Coverage:** Full — `mvp-complete-journey.spec.ts` steps 10a/10b.

**Steps:**
1. Navigate to tracking detail `/app/tracking/{shipmentId}`
2. Fill "Gerir excecao" form: category (delay), severity (high), location, team, resolution plan
3. Submit exception → verify toast
4. Fill "Resolver excecao" form: resolution code (infrastructure_restored), status (in_transit), resolution summary
5. Submit resolution → verify toast

**Data requirements:** Existing shipment ID in transit

**Expected outcomes:** Exception recorded → audit event generated → notification dispatched → exception resolved → tracking returns to in_transit

**Edge cases:**
- Exception on already-resolved shipment → validation error
- Resolution without open exception → validation error
- Invalid severity/category combination → form validation

---

### P04 — Capacity Slot Booking

**Coverage:** Full — `mvp-complete-journey.spec.ts` step 6.

**Steps:**
1. Navigate to `/app/capacity`
2. Fill reservation form: Cargo ID, Slot ID, reference, purpose, units, responsible, datetime
3. Submit "Reservar capacidade"
4. Verify success toast with "Reserva governada"

**Data requirements:** Valid open slot ID (`local_demo_capacity_slot_open_001`), valid cargo ID

**Expected outcomes:** Reservation created with audit trail and outbox notification

**Edge cases:**
- Booking on fully saturated slot → advisory warning
- Duplicate reservation → idempotency handling
- Invalid slot ID → not-found error

---

### P05 — Admin User Management

**Coverage:** Full — `authenticated-platform.spec.ts` "authenticated admin can submit governed identity commands".

**Steps:**
1. Navigate to `/app/admin`
2. Invite user: fill name, email, select initial role → submit
3. Copy invitation link from form output
4. Open invitation link in new page
5. Accept invitation: fill name, password, confirm → submit
6. Go back to admin page, assign additional role
7. Select user and role from dropdowns → submit

**Data requirements:** Unique email, admin role `tenant.operations_viewer`

**Expected outcomes:** User invited → membership created → invitation accepted → user activated → role assigned

**Edge cases:**
- Invite non-unique email → rejection
- Assign role user already has → idempotent success
- Cancel invitation before acceptance → status change
- Resend invitation → new token generated

---

### P06 — Report Generation

**Coverage:** Full — `authenticated-platform.spec.ts` + `mvp-complete-journey.spec.ts` step 13.

**Steps:**
1. Navigate to `/app/reports`
2. Verify export links visible: Cargo CSV, Tracking CSV, Planning CSV
3. Click "Exportar Cargo CSV"
4. Wait for download
5. Verify filename matches pattern `saptm-report-cargo-*.csv`

**Data requirements:** Seeded data present in database

**Expected outcomes:** CSV file downloaded with correct filename pattern

**Edge cases:**
- Empty dataset → CSV with headers only
- Concurrent export requests → rate limiting
- Export during outbox processing → eventual consistency

---

### P07 — 2FA Setup and Login

**Coverage:** None.

**Steps (target):**
1. Navigate to `/app/security`
2. Click "Iniciar MFA"
3. Scan QR code with authenticator app or copy setup key
4. Enter TOTP code to verify
5. Confirm 2FA activation
6. Sign out
7. Sign in with email + password
8. Enter TOTP code on challenge page
9. Verify successful authentication to `/app`
10. Navigate to `/app/security`, verify MFA status shows as active

**Data requirements:** TOTP-compatible authenticator app, valid session

**Expected outcomes:** 2FA enabled → subsequent logins require TOTP → recovery codes generated and displayed

**Edge cases:**
- Invalid TOTP code → error, re-prompt
- Expired TOTP window → retry allowed
- Backup code login → valid alternative path
- 2FA disabled after setup → flow reversal

**Blocking dependencies:** Requires seeded user with 2FA not yet enabled or test user provisioned without 2FA

---

### P08 — Integration Adapter Workflows

**Coverage:** Full — `authenticated-platform.spec.ts` "authenticated admin can submit governed integration commands".

**Steps covered:**
1. Create service account → API key displayed
2. Register external event with service account
3. Process Port TOS movement (gate_in)
4. Process Rail TMS movement (train_departed)
5. Process Carrier TMS movement (delivery_completed)
6. Process Telematics/GPS position (position_reported)
7. Process Customs/ERP status (customs_cleared)
8. Process Warehouse/WMS activity (loaded_for_dispatch)

**Expected outcomes:** All adapter types process successfully with idempotency, audit trail, and tracking updates

---

### P09 — Audit Trail Search and Filter

**Coverage:** Full — `authenticated-platform.spec.ts` + `mvp-complete-journey.spec.ts` step 12.

**Steps:**
1. Navigate to `/app/audit`
2. Fill search field (Acao) with cargo reference prefix
3. Select severity filter (critical)
4. Click "Pesquisar"
5. Verify URL contains search parameters
6. Verify matching audit records visible in results

**Expected outcomes:** Filtered audit results match criteria; CSV export available

---

### P10 — Transport Planning Lifecycle

**Coverage:** Full — `authenticated-platform.spec.ts` "authenticated operator can submit governed planning commands".

**Steps covered:**
1. Confirm transport order with cargo ID, route, carrier, planner
2. Reschedule existing transport order with new route and times
3. Cancel transport order with reason
4. Dispatch transport order with operational instructions

**Expected outcomes:** Each command shows success toast with confirmation; page reload shows updated status; audit events generated

---

## 3. Coverage Heat Map

```
Module          | P01 | P02 | P03 | P04 | P05 | P06 | P07 | P08 | P09 | P10
────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Sign-in/Auth    |  ✓  |  ✓  |  —  |  —  |  ✓  |  —  |  ✗  |  —  |  —  |  —
Cargo           |  —  |  ✓  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —
Tracking        |  —  |  ✓  |  ✓  |  —  |  —  |  —  |  —  |  —  |  —  |  —
Capacity        |  —  |  ✓  |  —  |  ✓  |  —  |  —  |  —  |  —  |  —  |  —
Planning        |  —  |  ✓  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  ✓
Tariff/Pricing  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —
Admin/Identity  |  ✓  |  —  |  —  |  —  |  ✓  |  —  |  —  |  —  |  —  |  —
Audit           |  —  |  ✓  |  —  |  —  |  —  |  —  |  —  |  —  |  ✓  |  —
Reports         |  —  |  ✓  |  —  |  —  |  —  |  ✓  |  —  |  —  |  —  |  —
Notifications   |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  —
Integrations    |  —  |  —  |  —  |  —  |  —  |  —  |  —  |  ✓  |  —  |  —
Security/2FA    |  —  |  —  |  —  |  —  |  —  |  —  |  ✗  |  —  |  —  |  —
```

---

## 4. Missing Paths (Priority Order)

| Priority | Path | Reason |
|---|---|---|
| P0 | 2FA setup and login flow | Security-critical; manual verification only |
| P0 | Password reset flow | Account recovery fundamental |
| P0 | Multi-tenant data isolation validation | Compliance requirement per Article II |
| P1 | Offline/network error handling | Resilience requirement per Article VII |
| P1 | Concurrent session management | Security requirement per Article II |
| P2 | Cross-tenant access attempt | Security boundary validation |
| P2 | Rate-limited endpoint behavior | Infrastructure requirement per Article II |
| P3 | Bulk data import/export edge cases | Operational scalability |
| P3 | Browser back/forward navigation | UX requirement per Article IV |
