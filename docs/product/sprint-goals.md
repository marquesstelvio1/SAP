# SAPTM — Sprint Goals (Sprint A & B)

> **Departamento:** Product  
> **Versão:** 1.0.0  
> **Data:** 2026-07-02  
> **Período:** Q3 2026 (Julho — Setembro)

---

## Sprint A — "Fundação de Dados" (Dias 1-14)

### Tema
**"Se não podemos medir, não podemos melhorar."**

Completar a instrumentação de analytics e fechar os maiores gaps de experiência do operador.

### Sprint Goal
> **Completar a instrumentação de 38 eventos PostHog, implementar breadcrumb de navegação e página de perfil, e entregar o fluxo de registo de organização (signup) com faturação básica via Stripe.**

### Backlog Items

| # | Item | RICE | Critério de Sucesso | Dependências |
|---|------|------|---------------------|--------------|
| SA-1 | **Instrumentar 16 eventos PostHog em falta** | 13.50 | 100% dos eventos da taxonomia são capturados em produção | Hook `useCaptureEvent` já existe |
| SA-2 | **Componente Breadcrumb + implementação em 8 rotas profundas** | 18.00 | Breadcrumb visível em todas as páginas de detalhe (`[shipmentId]`, detalhe de carga, etc.) | Nenhuma |
| SA-3 | **Página de Perfil do Utilizador** | 5.33 | Utilizador pode editar nome, email, foto, palavra-passe e preferências de notificação | Auth session |
| SA-4 | **Adoção total de spacing tokens em todos os componentes** | 4.50 | Zero valores arbitrários de `p-*`, `px-*`, `py-*`, `m-*`, `gap-*` em componentes UI | Tokens já definidos |
| SA-5 | **Fluxo de registo de organização (signup flow)** | 3.20 | Novo utilizador pode criar organização sem intervenção manual de DB | P0-002 |
| SA-6 | **Checkout Stripe básico + plano Pro** | 2.40 | Organização pode subscrever plano Pro com cartão de crédito | SA-5 |

### OKRs Impactados

| OKR | KRs Impactados |
|-----|----------------|
| O1: Eficiência do Operador | KR 1.3 (>90% sem erros de validação) |
| O2: Visibilidade Unificada | KR 2.1 (timeline unificada) — breadcrumb contribui |
| O3: Rastreabilidade Total | KR 3.3 (<15s pesquisa audit trail) |
| O4: Maturidade SaaS | KR 4.1 (100% self-service), KR 4.4 (NPS >40) |
| **O5: Decisões por Dados** (novo) | KR 5.1 (100% eventos instrumentados), KR 5.2 (dashboard semanal) |

### Quality Gates

- [ ] 16 eventos PostHog instrumentados e verificados em ambiente de dev
- [ ] Breadcrumb visível e funcional em rotas profundas
- [ ] Perfil do utilizador: editar nome, email, foto, palavra-passe
- [ ] Zero hardcoded spacing values em componentes `@saptm/ui`
- [ ] Fluxo de signup → criação de organização → primeira página
- [ ] Checkout Stripe: plano Pro → pagamento → confirmação

### Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Stripe webhook não processado corretamente | Média | Testar webhooks localmente com Stripe CLI |
| Signup flow com validação de email incompleta | Média | Usar Better Auth email verification |
| Breadcrumb não funciona em rotas com segments dinâmicos | Baixa | Testar com `[shipmentId]` e `[teamId]` |

---

## Sprint B — "Self-Service Enterprise" (Dias 15-28)

### Tema
**"Autonomia para o administrador, confiança para o cliente enterprise."**

Habilitar self-service completo de organização, SSO enterprise, equipas com scoping de permissões, e caching client-side para performance.

### Sprint Goal
> **Entregar SSO/SAML, gestão de equipas com scoping de permissões, TanStack Query para caching client-side, configuração de organização (branding) e webhook delivery completo.**

### Backlog Items

| # | Item | RICE | Critério de Sucesso | Dependências |
|---|------|------|---------------------|--------------|
| SB-1 | **SSO/OAuth (Google, Microsoft, SAML)** | 2.40 | Utilizador pode autenticar-se com Google, Microsoft ou SAML SSO | Better Auth OAuth config |
| SB-2 | **Gestão de Equipas com scoping de permissões** | 3.00 | Admin pode criar equipas, atribuir membros e definir permissões por equipa | Organizações (SA-5) |
| SB-3 | **TanStack Query para caching client-side** | 3.50 | Páginas interativas (tracking, cargo) usam TanStack Query com cache e dedup | Loading states (✅) |
| SB-4 | **Página de Configuração da Organização (branding)** | 3.20 | Admin pode alterar nome, logótipo, cores da organização | Organizações (SA-5) |
| SB-5 | **Webhook delivery real (worker + retry + dead-letter)** | 2.40 | Eventos da plataforma são entregues a endpoints externos com retry | EventBus (✅) |
| SB-6 | **Dark mode toggle no shell** | 8.40 | Utilizador pode alternar entre light e dark mode no sidebar | ThemeProvider (✅) |

### OKRs Impactados

| OKR | KRs Impactados |
|-----|----------------|
| O4: Maturidade SaaS | KR 4.1 (self-service), KR 4.2 (>50% equipas), KR 4.4 (NPS) |
| O2: Visibilidade Unificada | TanStack Query reduz latência percebida |
| O5: Decisões por Dados | Dashboard de produto visível |

### Quality Gates

- [ ] Login com Google funciona em staging
- [ ] Login com Microsoft funciona em staging
- [ ] SAML SSO configurado para pelo menos 1 IdP de teste
- [ ] Admin pode criar equipa, adicionar membros, definir permissões
- [ ] Páginas de tracking e cargo usam TanStack Query com cache funcional
- [ ] Organização pode alterar branding (logo, nome, cores)
- [ ] Webhook entrega evento para endpoint de teste com retry em caso de 5xx
- [ ] Dark mode toggle funcional e persistente (localStorage)

### Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| SAML configuração complexa | Alta | Priorizar OAuth primeiro, SAML como extensão |
| TanStack Query conflito com RSC data fetching | Média | Usar TQ apenas em client components interativos |
| Webhook retry causa duplicação de eventos | Média | Idempotency key no header de webhook |

---

## Mapa de Progresso (Scorecard Target)

| Dimensão | Atual | Alvo SA | Alvo SB | Alvo Final |
|----------|-------|---------|---------|------------|
| Product Strategy | 82 | 85 | 88 | 95 |
| UX | 79 | 84 | 87 | 95 |
| UI / Design System | 84 | 88 | 90 | 96 |
| Accessibility | 70 | 72 | 74 | 92 |
| Performance | 74 | 76 | 82 | 92 |
| Security | 85 | 86 | 88 | 94 |
| Scalability | 72 | 74 | 78 | 90 |
| Maintainability | 78 | 82 | 85 | 92 |
| Testing | 62 | 62 | 65 | 90 |
| DevOps / SRE | 82 | 82 | 83 | 92 |
| Multi-Tenant | 52 | 65 | 78 | 95 |
| Design System | 78 | 84 | 88 | 96 |
| **OVERALL** | **76.5** | **80.0** | **84.5** | **95.0** |

---

> **Documento mantido pelo Departamento de Produto (@enterprise-product)**  
> *Última revisão: 2026-07-02*
