# SAPTM Journey Maps

## Persona 1: Logistics Operator — Daily Cargo Operations

**Name:** Carlos Mendes
**Role:** Logistics Operator
**Domain:** Cargo operations, tracking, exception handling

### Journey Phases

| Phase | Actions | Touchpoints | Pain Points | Opportunities |
|-------|---------|-------------|-------------|---------------|
| **Morning handoff** | Review nightly cargo updates, check new exceptions, review tracking alerts | `/app/cargo` overview, notification inbox, tracking overview | Inbox overload from non-critical notifications; hard to distinguish urgent vs routine | Smart notification grouping by severity; sticky "unresolved exceptions" indicator on nav |
| **Cargo registration** | Enter incoming cargo data, attach compliance docs, validate customs status | `/app/cargo` registration form, evidence upload, customs status selector | Repetitive data entry for regular shippers; customs codes hard to remember | Shipper templates saving default fields; customs code autocomplete from recent entries |
| **Transport planning** | Plan transport for released cargo, select mode, assign owner team | `/app/cargo` transport plan form, tracking linkage confirmation | Must manually verify compliance docs are approved before departure; no pre-flight checklist | Auto-check compliance status and present "clear to depart" / "blocked by: X" summary |
| **Departure recording** | Record departure time, location, operator; verify tracking shipment transitions | `/app/cargo` departure form, tracking timeline view | Multiple fields (location, operator, reference) must be entered under time pressure | Scan QR code at departure gate to auto-fill location and timestamp |
| **Exception management** | Record delivery exceptions, document evidence, notify stakeholders | `/app/cargo` exception form, photo/document upload, notification trigger | Writing exception summaries under operational pressure; capturing all required evidence fields | Structured exception wizard with guided prompts per exception type; voice-to-text for notes |
| **End-of-day reconciliation** | Verify all in-transit cargo, resolve pending exceptions, hand off to night shift | `/app/cargo` status dashboard, `/app/tracking` event timeline | No single view of "my pending items" across cargo and tracking | Unified "My Queue" showing exceptions, pending handoffs, and unverified evidence |

---

## Persona 2: Operations Manager — Capacity & Rate Management

**Name:** Maria Santos
**Role:** Operations Manager
**Domain:** Capacity planning, tariff management, team oversight

### Journey Phases

| Phase | Actions | Touchpoints | Pain Points | Opportunities |
|-------|---------|-------------|-------------|---------------|
| **Capacity review** | Check resource utilization, review advisory recommendations, adjust slot openings | `/app/capacity` overview, advisory panel, slot management | Multiple advisory recommendations without clear priority — hard to triage | Color-coded severity with "act now" / "review today" / "monitor" grouping |
| **Slot optimization** | Open new slots based on demand forecasts, close underutilized slots, block conflicting windows | `/app/capacity` slot open form, resource calendar view | No visual calendar showing slot density across resources; overlapping windows hard to spot | Gantt-style resource calendar with drag-to-adjust slot windows |
| **Rate card management** | Register rate cards, add pricing rules, review quote requests | `/app/tariffs` rate card form, rule editor, quote queue | Complex rate rule logic (per-weight, per-volume, percentage) error-prone without visual builder | Rule builder with calculation preview showing example quote impact |
| **Advisory decision** | Review capacity optimizer recommendations, approve/reject, record justification | `/app/capacity` advisory list, decision form, approval reference | Approval references must be manually entered; no audit trail summary for compliance | One-click approve with auto-generated approval reference; decision summary for audit export |
| **Quote approval** | Review tariff quotes, verify rate application, approve or reject with notes | `/app/tariffs` quote detail, line-item breakdown, approval form | Quote line items require manual verification against rate card rules; no side-by-side comparison | Side-by-side quote vs rate card view with auto-highlight of applied rules |
| **Team performance** | Review operator activity, exception resolution times, slot utilization metrics | `/app/reports` export, `/app/capacity` advisory analytics | Reports are export-only; no in-app performance dashboard | In-app analytics dashboard with trend lines, operator ranking, SLA compliance |

---

## Persona 3: Administrator — Tenant & Security Management

**Name:** Joao Oliveira
**Role:** Administrator
**Domain:** User management, RBAC, audit, security

### Journey Phases

| Phase | Actions | Touchpoints | Pain Points | Opportunities |
|-------|---------|-------------|-------------|---------------|
| **User onboarding** | Invite new users, assign initial roles, verify email status | `/app/admin` overview, invite form, user list | Invitation expiry tracking is manual; no visibility into who has not accepted | Invitation dashboard showing pending/expired/accepted with bulk resend |
| **Role engineering** | Define custom roles, map permissions, document role descriptions | `/app/admin` role create, permission selector, role list | 64+ permissions across 15 domains — selecting the right combination is overwhelming | Permission search and filter by domain; "role template" based on common patterns |
| **Permission audit** | Review who has access to critical operations, verify permission assignment, detect anomalies | `/app/admin` user detail, role membership, permission matrix | No permission change history; cannot see what changed since last review | Permission diff view showing changes over time with who made the change |
| **Security review** | Review session activity, check for suspicious patterns, verify 2FA adoption | `/app/security` overview, session list, audit log | Audit log search is text-based; no anomaly detection or alerting | Audit log with structured filters (action type, criticality, user); anomaly flags on unusual patterns |
| **Membership lifecycle** | Suspend departing users, revoke roles, handle offboarding | `/app/admin` membership update, role revoke form | No offboarding checklist; risk of missed permission revocation | Automated offboarding workflow: suspend → revoke roles → archive → audit trail |
| **Compliance reporting** | Export audit records for external compliance, generate access reports | `/app/audit` search, export, `/app/reports` export | Export format is fixed; no scheduled or automated compliance reports | Scheduled report generation with delivery to email; SOC2-ready export templates |
