# SAPTM Wireframes — Enterprise-Grade Screen Designs

> 20 screens with ASCII wireframes, desktop + mobile layouts, states, and interactions
> Date: 2026-06-22

---

## Screen Inventory

| # | Screen | Type | Status | Priority |
|---|---|---|---|---|
| 1 | Sign In | Auth | ✅ Existing | — |
| 2 | Two-Factor Auth | Auth | ✅ Existing | — |
| 3 | Forgot Password | Auth | ❌ Missing | P1 |
| 4 | Reset Password | Auth | ❌ Missing | P1 |
| 5 | Accept Invitation | Auth | ✅ Existing | — |
| 6 | Control Center (Dashboard) | Dashboard | ✅ Existing | — |
| 7 | Organization Settings | Admin | ❌ Missing | P0 |
| 8 | Team Management | Admin | ❌ Missing | P0 |
| 9 | Profile & Preferences | User | ❌ Missing | P1 |
| 10 | Billing & Subscriptions | SaaS | ❌ Missing | P0 |
| 11 | Audit Logs | Admin | ✅ Existing | — |
| 12 | Notifications | Operations | ✅ Existing | — |
| 13 | Cargo Management | Operations | ✅ Existing | — |
| 14 | Tracking | Operations | ✅ Existing | — |
| 15 | Capacity | Operations | ✅ Existing | — |
| 16 | Planning | Operations | ✅ Existing | — |
| 17 | Tariffs | Operations | ✅ Existing | — |
| 18 | Integrations | Admin | ✅ Existing | — |
| 19 | Reports & Analytics | Reports | 🟡 Partial | P2 |
| 20 | Help & Documentation | Support | ❌ Missing | P3 |

---

## Screen 1: Sign In

**Goal:** Authenticate user with email/password, handle 2FA redirect
**Actors:** All users (authenticated and unauthenticated)
**States:** idle, validating, submitting, error (invalid credentials), 2FA redirect, success

### Desktop Layout

```
+------------------------------------------------------------------+
|  +------------------------------------------------------------+  |
|  |  LEFT PANEL (0.95fr)          |  RIGHT PANEL (1.05fr)      |  |
|  |  Dark sidebar theme           |  White background           |  |
|  |                                |                             |  |
|  |  ST                            |  [Logo]  SAPTM             |  |
|  |  SAPTM                         |                             |  |
|  |  Enterprise Logistics OS       |  Aceda a sua conta          |  |
|  |                                |                             |  |
|  |  [Foundation Badge]            |  +------------------------+ |  |
|  |                                |  | Email                  | |  |
|  |  Accesso seguro antes          |  | [____________________] | |  |
|  |  de qualquer operacao          |  |                        | |  |
|  |  logistica.                    |  | Password               | |  |
|  |                                |  | [____________________] | |  |
|  |  Better Auth                   |  |                        | |  |
|  |  RBAC/ABAC                     |  | [x] Lembrar-me         | |  |
|  |  Audit-ready                   |  |                        | |  |
|  |                                |  | [Entrar]               | |  |
|  |                                |  |                        | |  |
|  |                                |  | Esqueceu-se da password?| |  |
|  |                                |  |                        | |  |
|  |                                |  | Ainda nao tem conta?   | |  |
|  |                                |  | [Criar organizacao]    | |  |
|  |                                |  +------------------------+ |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### Mobile Layout

```
+-----------------------------+
|  [Logo]  SAPTM              |
|                             |
|  Aceda a sua conta          |
|                             |
|  +-----------------------+  |
|  | Email                 |  |
|  | [________________]    |  |
|  |                       |  |
|  | Password              |  |
|  | [________________]    |  |
|  |                       |  |
|  | [x] Lembrar-me        |  |
|  |                       |  |
|  | [Entrar]              |  |
|  |                       |  |
|  | Esqueceu-se da pass?  |  |
|  | Criar organizacao     |  |
|  +-----------------------+  |
+-----------------------------+
```

### States

| State | Behavior |
|---|---|
| **idle** | Empty form, submit disabled |
| **validating** | Field errors shown inline |
| **submitting** | Button shows spinner "A validar..." |
| **error** | Error banner: "Credenciais invalidas" |
| **2FA redirect** | Redirect to `/two-factor` |
| **success** | Redirect to `/app` (or `?next=` param) |

---

## Screen 2: Forgot Password [NEW]

**Goal:** Send password reset email to user
**Actors:** Unauthenticated users who forgot credentials
**States:** idle, submitting, success (email sent), error (email not found)

### Desktop Layout

```
+---------------------------------------------------------+
|  +---------------------------------------------------+  |
|  |  Card (centered, max-w-md)                        |  |
|  |                                                   |  |
|  |  [← Voltar ao login]                             |  |
|  |                                                   |  |
|  |  Recuperar password                               |  |
|  |  Enviaremos um link para redefinir a sua password. |  |
|  |                                                   |  |
|  |  Email                                            |  |
|  |  [____________________________________________]   |  |
|  |                                                   |  |
|  |  [Enviar link de recuperacao]                     |  |
|  |                                                   |  |
|  |  (success state):                                 |  |
|  |  [✅] Email enviado                              |  |
|  |  Verifique o seu email para redefinir a password. |  |
|  |  Nao recebeu? [Reenviar]                         |  |
|  +---------------------------------------------------+  |
+---------------------------------------------------------+
```

### Mobile Layout

```
+-----------------------------+
|  ← Voltar ao login          |
|                             |
|  Recuperar password         |
|  Enviaremos um link...      |
|                             |
|  Email                      |
|  [_____________________]    |
|                             |
|  [Enviar link]              |
+-----------------------------+
```

### States

| State | Behavior |
|---|---|
| **idle** | Email field empty |
| **submitting** | Button spinner "A enviar..." |
| **success** | Success message with resend option |
| **error** | "Email nao encontrado" or "Erro ao enviar" |

---

## Screen 3: Control Center (Dashboard)

**Goal:** Provide operational overview and system health at a glance
**Actors:** All authenticated users (content varies by RBAC)
**States:** loading, empty, data, error, offline

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
| [Search Cmd+K]                    [Theme] [Org Switcher] [Avatar] |
+------------------------------------------------------------------+
| Sidebar        |  Main Content                                    |
| (w-72)         |                                                  |
|                 |  +--------------------------------------------+ |
| FOUNDATION     |  |  Foundation Control Center                  | |
|  [>] Control   |  |  [P1 local em fecho] [Tenant resolvido]     | |
|  [>] Profile   |  |  +--------+ +--------+ +--------+ +------+ | |
|  [>] Security  |  |  | Sessao | | Perms  | | API    | | Escr | | |
|                 |  |  | Ativa  | | 12 gr  | | Online | | 3/4  | | |
| OPERATIONS     |  |  +--------+ +--------+ +--------+ +------+ | |
|  [>] Tracking  |  |  +--------------------------------------------+ |
|  [>] Cargo     |  |                                                 |
|  [>] Capacity  |  |  +--------------------------------------------+ |
|  [>] Planning  |  |  | Operations Snapshot                        | |
|  [>] Tariffs   |  |  | +--------+ +--------+ +--------+ +------+ | |
|  [>] Reports   |  |  | Cargas  | Ativas  | Atrasos | Exc   | | |
|                 |  |  | 47      | 23      | 3       | 1     | | |
| WORKSPACE      |  |  +--------+ +--------+ +--------+ +------+ | |
|  [>] Notif     |  |  +--------------------------------------------+ |
|  [>] Intg      |  |                                                 |
|  [>] Audit     |  |  +--------------------------------------------+ |
|  [>] Settings  |  |  | Readiness Checklist                       | |
|                 |  |  | [✅] App Shell         [🔒] Escrita       | |
| ADMIN          |  |  | [✅] Tenant             [🔄] Proxima feat | |
|  [>] Members   |  |  +--------------------------------------------+ |
|  [>] Roles     |  |                                                 |
|  [>] Teams     |  |  +--------------------------------------------+ |
|  [>] Billing   |  |  | Permission Matrix                         | |
|  [>] Webhooks  |  |  | cargo.read      Permitted                  | |
|                 |  |  | cargo.register  Permitted                  | |
|  [User Card]    |  |  +--------------------------------------------+ |
|  John Doe       |  |                                                 |
|  john@org.com   |  +-------------------------------------------------+
|  [Sign Out]     |
+------------------------------------------------------------------+
```

### Mobile Layout

```
+-----------------------------+
| [=]  SAPTM    [Cmd+K] [av] |
+-----------------------------+
|                             |
| Foundation Control Center   |
| [P1 fecho] [Tenant]        |
|                             |
| Sessao   |  Perms   | API  |
| Ativa    |  12 gr   | On   |
|-----------------------------|
| Cargas | Ativas | Atrasos  |
| 47     | 23     | 3        |
|-----------------------------|
| Readiness                   |
| ✅ App Shell                |
| ✅ Tenant resolvido         |
|-----------------------------|
| [Bottom Nav]                |
| [Home] [Ops] [Admin] [User] |
+-----------------------------+
```

---

## Screen 4: Organization Settings [NEW]

**Goal:** Manage organization name, branding, security, and preferences
**Actors:** Tenant admin (tenant.manage permission)
**States:** loading, data, saving, error, success

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation  [Save] [Discard]                                  |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| SETTINGS        |  +--------------------------------------------+ |
|  [>] General    |  |  General Settings                          | |
|  [>] Branding   |  |                                            | |
|  [>] Security   |  |  Organization Name                         | |
|  [>] Members    |  |  [____________________________________]    | |
|  [>] Roles      |  |                                            | |
|  [>] Teams      |  |  Organization Slug                         | |
|  [>] Billing    |  |  [____________________________________]    | |
|  [>] Webhooks   |  |  saptm-logistics                           | |
|                  |  |                                            | |
|                  |  |  Organization Status                       | |
|                  |  |  [Active ▼]  [Suspend Organization]       | |
|                  |  |                                            | |
|                  |  |  Created: 12 Jan 2026                      | |
|                  |  |  Member count: 23                          | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  [Danger Zone]                             | |
|                  |  |  [Delete Organization]                     | |
|                  |  |  This action cannot be undone.             | |
|                  |  +--------------------------------------------+ |
+------------------------------------------------------------------+
```

### Branding Sub-page

```
+------------------------------------------------------------------+
| SETTINGS > Branding                                              |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  |  Organization Logo                                          | |
|  |  [+-------------------+]  Upload PNG/SVG, max 2MB           | |
|  |  |   Current Logo     |  [Remove]                           | |
|  |  +-------------------+                                       | |
|  |                                                              | |
|  |  Primary Color                                               | |
|  |  [#0052CC]  [_______]                                       | |
|  |                                                              | |
|  |  Favicon                                                     | |
|  |  [Upload]                                                    | |
|  +-------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Screen 5: Team Management [NEW]

**Goal:** Create and manage teams within organization
**Actors:** Tenant admin (team.manage permission)
**States:** loading, empty, data, creating, error

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Teams                        |  Team Details                      |
|                               |                                     |
| +-------------------------+  |  +-------------------------------+  |
| | All Teams (4)           |  |  | Warehouse Operations          |  |
| |                         |  |  | Created: 15 Mar 2026         |  |
| | [>] Warehouse Ops       |  |  | Members: 8                   |  |
| |    8 members            |  |  |                               |  |
| | [>] Tracking & Mon      |  |  |  [Edit Name] [Delete Team]    |  |
| |    3 members            |  |  +-------------------------------+  |
| | [>] Finance & Planning  |  |                                     |
| |    4 members            |  |  +-------------------------------+  |
| | [>] Compliance          |  |  |  Members                     |  |
| |    2 members            |  |  |  +-------------------------+ |  |
| |                         |  |  |  | Name         Role    [] | |  |
| | [+ Create Team]         |  |  |  | Ana Silva    Manager [] | |  |
| +-------------------------+  |  |  | Carlos Rocha Operat  [] | |  |
|                               |  |  | Maria Santos Operat  [] | |  |
|                               |  |  |                          | |  |
|                               |  |  | [+ Add Member]           | |  |
|                               |  |  +-------------------------+ |  |
|                               |  +-------------------------------+  |
+------------------------------------------------------------------+
```

### Mobile Layout

```
+-----------------------------+
| [<] Settings > Teams        |
|                             |
| [Warehouse Ops]   8 mems > |
| [Tracking & Mon]  3 mems > |
| [Finance & Plan]  4 mems > |
| [Compliance]      2 mems > |
|                             |
| [+ Create Team]             |
+-----------------------------+
```

---

## Screen 6: Profile & Preferences [NEW]

**Goal:** User profile management, preferences, and personal settings
**Actors:** All authenticated users
**States:** loading, data, saving, error, success

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| PROFILE         |  +--------------------------------------------+ |
|  [>] General    |  |  Profile                                   | |
|  [>] Password   |  |                                            | |
|  [>] Prefs      |  |  +--------+                               | |
|  [>] API Keys   |  |  | Avatar |  Name: John Doe               | |
|  [>] Sessions   |  |  | [IMG]  |  Email: john@org.com          | |
|                  |  |  +--------+  [Change Avatar]              | |
|                  |  |                                            | |
|                  |  |  Name                                      | |
|                  |  |  [____________________________________]    | |
|                  |  |                                            | |
|                  |  |  Email                                     | |
|                  |  |  [____________________________________]    | |
|                  |  |                                            | |
|                  |  |  Language & Region                         | |
|                  |  |  [Portugues (Portugal) ▼]                  | |
|                  |  |  Timezone: [Europe/Lisbon ▼]               | |
|                  |  |                                            | |
|                  |  |  [Save Changes]                            | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Notification Preferences                  | |
|                  |  |  [x] Email notifications                   | |
|                  |  |  [x] In-app notifications                  | |
|                  |  |  [ ] SMS alerts (operational)              | |
|                  |  |  Digest frequency: [Daily ▼]               | |
|                  |  +--------------------------------------------+ |
+------------------------------------------------------------------+
```

### Password Sub-page

```
+------------------------------------------------------------------+
| PROFILE > Password                                               |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  |  Change Password                                            | |
|  |                                                             | |
|  |  Current Password                                           | |
|  |  [________________________________________________]        | |
|  |                                                             | |
|  |  New Password                                               | |
|  |  [________________________________________________]        | |
|  |  Must be at least 12 characters                             | |
|  |                                                             | |
|  |  Confirm New Password                                       | |
|  |  [________________________________________________]        | |
|  |                                                             | |
|  |  [Update Password]                                          | |
|  +-------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Screen 7: Billing & Subscriptions [NEW]

**Goal:** View and manage subscription plan, invoices, usage, and payment methods
**Actors:** Tenant admin, finance manager (billing.manage, billing.view)
**States:** loading, data, upgrading, error, past_due, cancelled

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| SETTINGS        |  +--------------------------------------------+ |
|  [>] General    |  |  Billing & Subscription                   | |
|  [>] Branding   |  |                                            | |
|  [>] Security   |  |  Current Plan: [Pro]  [Upgrade ▼]          | |
|  [>] Members    |  |  Status: Active  [Manage on Stripe]        | |
|  [>] Roles      |  |  Next billing: 15 Jul 2026 — $299/month   | |
|  [>] Teams      |  |                                            | |
|  [>] Billing    |  +--------------------------------------------+ |
|  [>] Webhooks   |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Usage This Month                          | |
|                  |  |  Active Members    18/50  ████████░░ 36%  | |
|                  |  |  Cargo Registrations 142/∞ ████████░░ 28% | |
|                  |  |  Tracking Events    2,847/∞ █████░░░ 19%  | |
|                  |  |  API Calls         45,212/∞ ███░░░░░ 15%  | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Invoices                                 | |
|                  |  |  Date         Amount  Status  Download    | |
|                  |  |  15 Jun 2026  $299    Paid    [PDF]       | |
|                  |  |  15 May 2026  $299    Paid    [PDF]       | |
|                  |  |  15 Apr 2026  $299    Paid    [PDF]       | |
|                  |  |  [View All Invoices →]                     | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Payment Method                            | |
|                  |  |  Visa •••• 4242  Exp: 12/27  [Update]     | |
|                  |  +--------------------------------------------+ |
+------------------------------------------------------------------+
```

### Plan Comparison Modal

```
+------------------------------------------------------------------+
|  Compare Plans                                                   |
|                                                                   |
|  +-------------+ +-------------+ +-----------------------------+ |
|  |  Free       | |  Pro        | |  Enterprise                 | |
|  |  $0/month   | |  $299/month | |  Custom pricing             | |
|  |             | |             | |                             | |
|  |  5 members  | |  50 members | |  Unlimited members          | |
|  |  100 cargo  | |  Unlimited  | |  SSO/SAML                   | |
|  |  Basic      | |             | |  Audit retention config     | |
|  |  support    | |  API access | |  SLA 99.95%                 | |
|  |             | |  Priority   | |  Dedicated support          | |
|  |  [Current]  | |  [Upgrade]  | |  [Contact Sales]            | |
|  +-------------+ +-------------+ +-----------------------------+ |
+------------------------------------------------------------------+
```

---

## Screen 8: Help & Documentation [NEW]

**Goal:** Provide in-app help, documentation, and support resources
**Actors:** All authenticated users
**States:** loading, data, searching, empty (no results)

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| HELP            |  +--------------------------------------------+ |
|  [>] Quick      |  |  Help Center                              | |
|      Start      |  |                                            | |
|  [>] Guides     |  |  [Search documentation...____________] [🔍]| |
|  [>] API Docs   |  |                                            | |
|  [>] Changelog  |  |  Popular Topics                            | |
|  [>] Support    |  |  +----------+ +----------+ +-------------+ | |
|                  |  |  | Getting  | | Cargo    | | Tracking    | | |
|                  |  |  | Started  | | Lifecycle| | Events      | | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  |                                            | |
|                  |  |  Guide Categories                          | |
|                  |  |  • Cargo Management (12 articles)          | |
|                  |  |  • Tracking & Monitoring (8 articles)      | |
|                  |  |  • Capacity Planning (6 articles)          | |
|                  |  |  • Transport Planning (5 articles)         | |
|                  |  |  • Tariff & Pricing (4 articles)           | |
|                  |  |  • Integrations (7 articles)               | |
|                  |  |  • Administration (10 articles)            | |
|                  |  |  • Account & Billing (5 articles)          | |
|                  |  |                                            | |
|                  |  |  Need more help?                           | |
|                  |  |  [Contact Support] [View Documentation]    | |
|                  |  +--------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Screen 9: Cargo Management (Existing — Enhanced)

**Goal:** Full cargo lifecycle management with next-action guidance
**Actors:** Cargo operator, compliance officer, operations manager
**States:** loading, empty, data, error, offline

### Desktop Layout (Enhanced with Filters + Pagination)

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| OPERATIONS      |  Cargo Management                               |
|  [>] Cargo      |                                                  |
|                  |  +--------+ +--------+ +--------+ +----------+ |
|                  |  | Total  | | Ativas | | Pend   | | A entreg | |
|                  |  | 47     | | 23     | | 12     | | 8        | |
|                  |  +--------+ +--------+ +--------+ +----------+ |
|                  |                                                  |
|                  |  Filters: [Status ▼] [Type ▼] [Search...] [🔍] |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  | Ref     | Type  | Status  | Next   |     | |
|                  |  | CRG-001 | Cont  | In Tran | Record | [>] | |
|                  |  | CRG-002 | Bulk  | Held    | Resolv | [>] | |
|                  |  | CRG-003 | Haz   | Delivd  | —      | [>] | |
|                  |  | CRG-004 | Refr  | Ready   | Releas | [>] | |
|                  |  +--------------------------------------------+ |
|                  |  < Page 1 of 10 >  [1] [2] [3] ... [10]       |
|                  |                                                  |
|                  |  [+ Register Cargo]                             |
+------------------------------------------------------------------+
```

---

## Screen 10: Tracking Detail (Existing — Enhanced with Timeline)

**Goal:** View shipment timeline, record events, manage exceptions
**Actors:** Tracking operator
**States:** loading, data, error, empty (no events)

### Desktop Layout (Enhanced with Timeline Component)

```
+------------------------------------------------------------------+
| Top Navigation  [< Back to Tracking]                              |
+------------------------------------------------------------------+
| Shipment: SHP-0042 — Rail — In Transit                           |
| [Exception] [Late]                                                |
|                                                                   |
| +---------------------------+ +----------------------------------+ |
| | Shipment Details         | | Timeline                         | |
| | Origin: Porto de Leixoes | |                                  | |
| | Destination: Terminal    | | [●] 14:30 — Departed Leixoes     | |
| |   Cacia                  | | [●] 12:00 — Customs Released     | |
| | Mode: Rail               | | [●] 08:00 — Customs Hold         | |
| | Priority: High (1)       | | [⚠] 06:30 — Exception: Customs   | |
| | Created: 20 Jun 2026     | | [●] 22:00 — Arrived Porto        | |
| |                          | | [●] 18:00 — Departed Terminal    | |
| | Cargo: CRG-001           | | [●] 14:00 — Departed Origin      | |
| | Transport Order: TO-003  | | [●] 10:00 — Created              | |
| |                          | |                                  | |
| | [View Cargo →]           | | [+ Record Event]                 | |
| +---------------------------+ +----------------------------------+ |
|                                                                   |
| +--------------------------------------------------------------+ |
| |  Linked Resources                                             | |
| |  [Cargo CRG-001] [Transport Order TO-003] [Audit Records]    | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Screen 11: Reports & Analytics (Enhanced)

**Goal:** Generate reports, view analytics dashboards, schedule exports
**Actors:** Operations manager, auditor, report exporter
**States:** loading, data, generating, error, empty

### Desktop Layout (Enhanced with Analytics Charts)

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| OPERATIONS      |  Reports & Analytics                            |
|  [>] Reports    |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Overview (Last 30 days)                  | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  |  | Cargo    | | Shipments| | Exceptions  | | |
|                  |  |  | Processed| | Delivered| |   Resolved  | | |
|                  |  |  | 142      | | 98       | | 12 of 15    | | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Cargo by Status  (Chart)                  | |
|                  |  |  ████████████ 45% In Transit              | |
|                  |  |  ████████     30% Delivered               | |
|                  |  |  ████         15% Registered              | |
|                  |  |  ██           10% Exception               | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  |  Export Reports                           | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  |  | Tracking | | Cargo    | | Capacity    | | |
|                  |  |  | [Export] | | [Export] | | [Export]    | | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  |  | Planning | | Tariff   | | Scheduled   | | |
|                  |  |  | [Export] | | [Export] | | Reports [>] | | |
|                  |  |  +----------+ +----------+ +-------------+ | |
|                  |  +--------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Screen 12: Notifications (Existing — Enhanced with Preferences)

**Goal:** View, filter, manage operational notifications
**Actors:** All authenticated users
**States:** loading, empty, data, error

### Desktop Layout (Enhanced with Notification Preferences)

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| WORKSPACE       |  Notifications          [⚙ Preferences] [All]  |
|  [>] Notif      |                                                  |
|                  |  Filters: [All] [Unread] [Archived] [Severity]  |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  | [🔴] Cargo CRG-001 arrived at destination | |
|                  |  |      20 min ago — Terminal Cacia          | |
|                  |  |--------------------------------------------| |
|                  |  | [🟡] Capacity advisory: Slot SAT-001      | |
|                  |  |      is at 90% capacity                   | |
|                  |  |      1 hour ago                            | |
|                  |  |--------------------------------------------| |
|                  |  | [🟢] Transport order TO-004 confirmed      | |
|                  |  |      2 hours ago                           | |
|                  |  |--------------------------------------------| |
|                  |  | [🔴] Exception: Customs hold on SHP-0092  | |
|                  |  |      3 hours ago                           | |
|                  |  +--------------------------------------------+ |
|                  |                                                  |
|                  |  [Mark All Read]  [Load More]                    |
+------------------------------------------------------------------+
```

---

## Screen 13: Admin — Identity & RBAC (Existing)

**Goal:** Manage organization members, roles, permissions, and invitations
**Actors:** Tenant admin
**States:** loading, data, error

### Desktop Layout

```
+------------------------------------------------------------------+
| Top Navigation                                                    |
+------------------------------------------------------------------+
| Sidebar         |  Main Content                                   |
|                  |                                                  |
| ADMIN           |  Identity & RBAC                               |
|  [>] Members    |                                                  |
|  [>] Roles      |  +--------+ +--------+ +--------+ +----------+ |
|  [>] Perms      |  | Active | | Roles  | | Pending | | Invites  | |
|                  |  | 18     | | 12     | | 3       | | 5 sent   | |
|                  |  +--------+ +--------+ +--------+ +----------+ |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  | Members                     [+ Invite]    | |
|                  |  | Name     Email     Role     Status    []   | |
|                  |  | Ana S.   ana@...   Admin    Active    [>] | |
|                  |  | Carlos   car@...   Oper     Active    [>] | |
|                  |  | Maria    mar@...   Viewer   Invited   [>] | |
|                  |  +--------------------------------------------+ |
|                  |  < Page 1 of 3 >                                |
|                  |                                                  |
|                  |  +--------------------------------------------+ |
|                  |  | Roles — Permission Matrix                  | |
|                  |  | Role        | Permissions              Edit| |
|                  |  | Admin       | All 37                   [✎] | |
|                  |  | Cargo Op    | cargo.*, tracking.*      [✎] | |
|                  |  | Viewer      | cargo.read, tracking.read [✎] | |
|                  |  | [+ Create Role]                           | |
|                  |  +--------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Cross-Cutting Patterns

### Empty State Pattern

```
+---------------------------------------------------------+
|  [Illustration: Box with magnifying glass]              |
|                                                         |
|  Nenhum registro encontrado                             |
|  Nao existem cargas registadas nesta organizacao.        |
|                                                         |
|  [Registar primeira carga]  [Ver documentacao]          |
+---------------------------------------------------------+
```

### Error State Pattern

```
+---------------------------------------------------------+
|  [⚠] Erro ao carregar dados                            |
|                                                         |
|  Nao foi possivel carregar os dados. Tente novamente    |
|  ou contacte o suporte se o problema persistir.          |
|                                                         |
|  [Tentar novamente]  [Contactar suporte]                |
+---------------------------------------------------------+
```

### Loading State Pattern

```
+---------------------------------------------+
|  +----------+ +----------+ +----------+      |
|  | ░░░░░░░░ | | ░░░░░░░░ | | ░░░░░░░░ |      |
|  | ░░░░░░░░ | | ░░░░░░░░ | | ░░░░░░░░ |      |
|  +----------+ +----------+ +----------+      |
|                                               |
|  +-----------------------------------------+  |
|  | ░░░░░ ░░░░░░░ ░░░░░ ░░░░░ ░░░░░ ░░░░░ |  |
|  | ░░░░░ ░░░░░░░ ░░░░░ ░░░░░ ░░░░░ ░░░░░ |  |
|  | ░░░░░ ░░░░░░░ ░░░░░ ░░░░░ ░░░░░ ░░░░░ |  |
|  +-----------------------------------------+  |
+---------------------------------------------+
```

### Confirm Dialog Pattern

```
+---------------------------------------------------------+
|  Confirmar accao                                         |
|                                                         |
|  Tem a certeza que pretende cancelar a reserva          |
|  RES-0042? Esta accao nao pode ser desfeita.             |
|                                                         |
|  [Cancelar]  [Sim, cancelar reserva]                    |
+---------------------------------------------------------+
```

---

## Responsive Behavior Summary

| Screen | Desktop (1280+) | Tablet (768-1279) | Mobile (<768px) |
|---|---|---|---|
| Sign In | Split layout | Stacked | Full-width form |
| Dashboard | Sidebar + cards grid | Collapsed sidebar + stacked | Single column |
| Cargo | Filters + table | Filters + simplified table | List cards |
| Tracking | Detail + timeline | Detail + simplified timeline | Timeline only |
| Settings | Sidebar nav + content | Tabs instead of sidebar | Single column |
| Admin | Members/roles side-by-side | Tabs | List items |
| Billing | Plan + usage + invoices | Tabs | Single column |
| Notifications | Full list | Simplified list | List items |
| Reports | Charts + export cards | Charts only | Export only |

---

## Design System Components Required for Wireframes

| Wireframe | Components Required |
|---|---|
| Sign In | Button, Input, Checkbox, Card, Badge |
| Dashboard | Card, Badge, Table, StatusTile, MetricTile, Skeleton |
| Settings | Sidebar, Input, Button, Switch, Avatar, Separator, Breadcrumb |
| Teams | Card, Table, Button, Avatar, Badge, Dialog |
| Profile | Input, Avatar, Button, Switch, Select |
| Billing | Card, Table, Badge, Progress, Button, Dialog |
| Tracking Detail | Timeline (new), Card, Badge, Button, Table |
| Reports | Card, Chart, Button, Select, Badge |
| Notifications | Card, Badge, Button, Switch |
| Admin | Table, Badge, Button, Dialog, Tabs |
| Help | Card, Input, Search, Badge |
| Empty State | EmptyState, Button |
| Error State | ErrorCard, Button |
| Confirm Dialog | Dialog, Button |
