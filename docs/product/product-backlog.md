# SAPTM — Product Backlog (Prioritizado com RICE)

> **Departamento:** Product  
> **Versão:** 1.1.0  
> **Data:** 2026-07-02  
> **Estado:** Vivo — revisto trimestralmente

---

## Modelo de Priorização: RICE

| Factor | Definição | Escala |
|--------|-----------|--------|
| **Reach** | Quantos utilizadores/operações são impactados por sprint | 1-5 (≤5 → 100+) |
| **Impact** | Impacto no operador ou no negócio | 0.25 (mínimo) — 3 (máximo) |
| **Confidence** | Quão certos estamos do impacto | 20% (palpite) — 100% (dados) |
| **Effort** | Esforço estimado em semanas-homem | Número de semanas |

**RICE Score = (Reach × Impact × Confidence) / Effort**

---

## Backlog — Ordenado por RICE Score

### Sprint A (Next)

| # | Feature | Reach | Impact | Conf. | Effort | RICE | Priority |
|---|---------|-------|--------|-------|--------|------|----------|
| 1 | **Instrumentação de 38 eventos PostHog** (16 faltam) | 5 | 3 | 90% | 1 | 13.50 | P1 |
| 2 | **Checkout de cobrança (Stripe)** — plano pro/enterprise | 4 | 3 | 80% | 4 | 2.40 | P0 |
| 3 | **Fluxo de registo de organização (signup)** | 4 | 3 | 80% | 3 | 3.20 | P0 |
| 4 | **Página de Perfil do Utilizador** (nome, email, foto, preferências) | 5 | 2 | 80% | 1.5 | 5.33 | P1 |
| 5 | **Componente Breadcrumb** + implementação em rotas profundas | 5 | 2 | 90% | 0.5 | 18.00 | P1 |
| 6 | **Dark mode toggle** — ligar ThemeToggle no shell | 4 | 1.5 | 70% | 0.5 | 8.40 | P2 |
| 7 | **Adoção total de spacing tokens** (globals.css + componentes) | 5 | 2 | 90% | 2 | 4.50 | P1 |

### Sprint B (Next + 1)

| # | Feature | Reach | Impact | Conf. | Effort | RICE | Priority |
|---|---------|-------|--------|-------|--------|------|----------|
| 8 | **SSO/OAuth (Google, Microsoft, SAML)** | 4 | 3 | 80% | 4 | 2.40 | P0 |
| 9 | **Equipas com scoping de permissões** (team-based access control) | 4 | 3 | 75% | 3 | 3.00 | P0 |
| 10 | **Webhook delivery real** (worker + retry + dead-letter) | 3 | 3 | 80% | 3 | 2.40 | P1 |
| 11 | **TanStack Query** para caching client-side (páginas interativas) | 5 | 3 | 70% | 3 | 3.50 | P1 |
| 12 | **Notificações push** para eventos críticos (WebSocket/SSE) | 4 | 2.5 | 60% | 4 | 1.50 | P2 |
| 13 | **Página de Configuração de Organização** (branding, settings) | 4 | 2 | 80% | 2 | 3.20 | P1 |
| 14 | **Dashboard de produto** (PostHog + métricas de OKRs visíveis) | 3 | 2.5 | 70% | 1.5 | 3.50 | P2 |

### Sprint C (Later — Q4 2026)

| # | Feature | Reach | Impact | Conf. | Effort | RICE | Priority |
|---|---------|-------|--------|-------|--------|------|----------|
| 15 | **Feature flag system** (Unleash ou LaunchDarkly) | 5 | 2.5 | 60% | 3 | 2.50 | P2 |
| 16 | **Testes unitários frontend** (componentes críticos) | 5 | 2 | 50% | 4 | 1.25 | P2 |
| 17 | **SLA timers visuais** nas excepções | 4 | 2 | 60% | 1.5 | 3.20 | P2 |
| 18 | **Pesquisa NPS integrada** (PostHog survey) | 4 | 1.5 | 70% | 0.5 | 8.40 | P2 |
| 19 | **Timeline de tracking embed na página de carga** | 4 | 2.5 | 60% | 2 | 3.00 | P1 |
| 20 | **Capacity Optimizer Advisory** (regras + recomendação) | 3 | 2 | 40% | 6 | 0.40 | P3 |
| 21 | **Billing com usage metering** (Stripe) | 4 | 3 | 60% | 4 | 1.80 | P1 |
| 22 | **Exportar relatório de auditoria SOC2-ready** | 3 | 2 | 50% | 1 | 3.00 | P2 |

### Backlog (Q1 2027+)

| # | Feature | Reach | Impact | Conf. | Effort | RICE | Priority |
|---|---------|-------|--------|-------|--------|------|----------|
| 23 | **Portal do cliente (consignee)** | 3 | 2 | 40% | 8 | 0.30 | P3 |
| 24 | **App mobile (Expo)** | 3 | 2 | 30% | 12 | 0.15 | P3 |
| 25 | **Predição de atrasos baseada em ML** | 3 | 2.5 | 25% | 10 | 0.19 | P3 |
| 26 | **Mapa interativo de cargas em trânsito** | 3 | 2 | 30% | 6 | 0.30 | P3 |
| 27 | **PWA + offline support** | 2 | 1.5 | 30% | 4 | 0.23 | P3 |
| 28 | **i18n (multi-idioma)** | 2 | 1.5 | 20% | 6 | 0.10 | P3 |

---

## Mapa de Dependências

```
P0-001 (Billing/Stripe) ─── depende de ───→ P0-002 (Signup + Organização)
                                                   │
P0-003 (SSO/SAML) ─────────────────────────────────┤
                                                   │
P0-004 (Equipas) ──────────────────────────────────┤
                                                   │
P1-002 (Breadcrumb) ─── sem dependências           │
                                                   ▼
P1-001 (Analytics resto) ─── sem dependências (UI já tem hook)
                                                   │
P1-004 (Spacing tokens) ─── sem dependências       │
                                                   │
P1-005 (Perfil) ─── depende de auth session        │
                                                   │
P1-006 (Webhooks) ─── depende de event bus (✅ ok) │
                                                   │
P1-011 (TanStack Query) ─── depende de loading states (✅ ok)
```

---

## Legendas de Prioridade

| Prioridade | Definição |
|------------|-----------|
| **P0** | Bloqueante para produção — sem isto o produto não pode ser vendido |
| **P1** | Alto impacto — deve estar nas próximas 2 sprints |
| **P2** | Impacto médio — agendar nas próximas 4-6 sprints |
| **P3** | Baixo impacto — backlog, reavaliar trimestralmente |

---

> **Documento mantido pelo Departamento de Produto (@enterprise-product)**  
> *Última revisão: 2026-07-02*  
> *Próxima revisão: 2026-10-02*
