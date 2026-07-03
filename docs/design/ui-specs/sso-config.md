# UI Spec: SSO Configuration Page

> **Departamento:** Visual Design
> **Tipo:** UI Specification
> **Data:** 2026-07-02
> **Prioridade:** Baixa (Sprint C)

## 1. Purpose

Allow Enterprise plan users to configure Single Sign-On (SSO/SAML) and OAuth provider settings for their organization.

## 2. Page Location

- **URL:** `/app/admin/authentication`
- **Breadcrumb:** `Administração > Autenticação`
- **Sidebar:** `Administração > Autenticação` (new item, Enterprise-only)

## 3. Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Autenticação                                                │
│  Configure o login da sua organização                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔐 SSO/SAML                                            │  │
│  │ ─────────────────────────────────────────────────────   │  │
│  │                                                         │  │
│  │ Domínio:  _______________________________________      │  │
│  │           [logisticaporto.pt]                           │  │
│  │           [Verificar domínio → DNS TXT record]         │  │
│  │           ✅ Verificado em 01/06/2026                  │  │
│  │                                                         │  │
│  │ IdP Metadata URL:  _________________________________   │  │
│  │                      [https://idp.example.com/metadata]│  │
│  │                                                         │  │
│  │ Ou fazer upload do ficheiro XML:  [Choose file]        │  │
│  │                                                         │  │
│  │ Entity ID:  https://saptm.app/auth/saml/metadata       │  │
│  │ ACS URL:    https://saptm.app/auth/saml/callback       │  │
│  │                                                         │  │
│  │ [Guardar configuração]                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🌐 Providers OAuth                                     │  │
│  │ ─────────────────────────────────────────────────────   │  │
│  │                                                         │  │
│  │ ┌──┐  Google Login       [⚙️ Configured]              │  │
│  │ └──┘  ──────────────────                              │  │
│  │       Client ID:  [*******************]                │  │
│  │       Client Secret:  [*******************]            │  │
│  │                                                         │  │
│  │ ┌──┐  Microsoft Login   [➕ Not configured]           │  │
│  │ └──┘  ──────────────────                              │  │
│  │       [Configure]                                       │  │
│  │                                                         │  │
│  │ ┌──┐  GitHub Login      [➕ Not configured]           │  │
│  │ └──┘  ──────────────────                              │  │
│  │       [Configure]                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⚙️ Provisionamento                                     │  │
│  │ ─────────────────────────────────────────────────────   │  │
│  │                                                         │  │
│  │ ┌─────────────────────────────────────────────────┐    │  │
│  │ │ Just-In-Time (JIT) Provisioning      [🔘 On]    │    │  │
│  │ │ Criar utilizadores automaticamente no primeiro   │    │  │
│  │ │ login via SSO.                                   │    │  │
│  │ └─────────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │ ┌─────────────────────────────────────────────────┐    │  │
│  │ │ Domain-wide Email Match               [🔘 Off]  │    │  │
│  │ │ Associar automaticamente emails do domínio à    │    │  │
│  │ │ organização.                                     │    │  │
│  │ └─────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 4. States

### Feature Not Available (Non-Enterprise Plan)

```tsx
<AccessState
  badgeLabel="Autenticação"
  title="SSO disponivel apenas no plano Enterprise"
  description="Contacte a equipa comercial para fazer upgrade."
  variant="blocked"
  cta={{ label: "Ver planos", href: "/app/settings/billing" }}
/>
```

### Loading
```tsx
<AccessState
  badgeLabel="Autenticação"
  title="A carregar ..."
  description="A obter configuração de autenticação..."
/>
```

### Error Loading Config
```tsx
<AccessState
  badgeLabel="Autenticação"
  title="Configuração indisponivel"
  description="Nao foi possivel carregar as definicoes de autenticacao."
  variant="error"
/>
```

### Domain Verification States

| State | Display |
|-------|---------|
| Not verified | `⚪ Por verificar` + dotted border indicator |
| Pending | `🔄 A verificar...` + spinner icon |
| Verified | `✅ Verificado em DD/MM/AAAA` + green check |
| Failed | `❌ Falha na verificação` + error message + retry CTA |

### SSO Enabled/Disabled States

| State | Behavior |
|-------|----------|
| Disabled | Only email/password login shown |
| Enabled + verified domain | SSO button on login screen for that domain |
| Enabled + no verified domain | Warning: "Verifique o domínio para ativar SSO" |

## 5. Form Validation Rules

| Field | Validation |
|-------|-----------|
| Domain | Valid domain format, no protocol prefix (`example.com` not `https://example.com`) |
| IdP Metadata URL | Valid HTTPS URL, must return valid SAML XML |
| IdP Metadata XML | Valid SAML XML, schema validation |
| Client ID | Required (for provider), no format validation |
| Client Secret | Required (for provider), masked input |

## 6. Key Components Needed

| Component | Type | Status |
|-----------|------|--------|
| `DomainVerifyCard` | Custom | 🔴 New — DNS verification UI |
| `SsoConfigForm` | Form | 🔴 New — SAML config fields |
| `OAuthProviderToggle` | Custom | 🔴 New — per-provider toggle + config |
| `JitProvisioningToggle` | Switch | 🟡 Reuse shadcn Switch |
