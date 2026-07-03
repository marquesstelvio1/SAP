# SAPTM Documentation Portal

> **Versão:** 1.0.0 | **Última actualização:** 2026-07-03 | **Departamento:** Documentação

Portal central de documentação do SAPTM — plataforma logística empresarial para operações ferroviárias e portuárias.

## Navegação por Audiência

### 👨‍💻 Developers
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [AGENTS.md](../AGENTS.md) | Instruções do projecto, stack, comandos, arquitectura | ✅ |
| [API_CONTRACTS.md](../docs/API_CONTRACTS.md) | Contratos RPC completos com metadata | ✅ |
| [RPC Strategy](rpc/rpc-strategy.md) | Estratégia de contratos oRPC | ✅ |
| [Environment Flow](ENVIRONMENT_FLOW.md) | Fluxo de variáveis de ambiente | ✅ |
| [Build & Run Commands](BUILD-RUN-COMMANDS.md) | Comandos de desenvolvimento e CI | ✅ |
| [Coding Standards](standards/coding-standards.md) | Padrões de código TypeScript | ✅ |
| [Testing Strategy](testing/testing-strategy.md) | Estratégia de testes | ✅ |

### 🏗️ Arquitectura
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [System Overview](architecture/system-overview.md) | Visão geral do sistema | ✅ |
| [C4 Context](architecture/c4-context.md) | Diagrama de contexto C4 | ✅ |
| [C4 Container](architecture/c4-container.md) | Diagrama de contentores C4 | ✅ |
| [C4 Component](architecture/c4-component.md) | Diagrama de componentes C4 | ✅ |
| [Domain Map](architecture/domain-map.md) | Mapa de domínios e bounded contexts | ✅ |
| [Dependency Map](architecture/dependency-map.md) | Mapa de dependências entre pacotes | ✅ |
| [Layer Boundaries](architecture/layer-boundaries.md) | Boundaries entre camadas | ✅ |
| [Deployment Architecture](architecture/deployment.md) | Arquitectura de deployment | ✅ |
| [Tenant Isolation](architecture/tenant-isolation.md) | Isolamento multi-tenant | ✅ |
| [Auth Architecture](architecture/auth.md) | Arquitectura de autenticação/autorização | ✅ |
| [Enterprise Business Architecture](enterprise/business-architecture.md) | Arquitectura de negócio | ✅ |
| [Enterprise Technical Architecture](enterprise/technical-architecture.md) | Arquitectura técnica enterprise | ✅ |

### 📋 ADRs (Architecture Decision Records)
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [ADR-0001](adr/0001-monorepo-turborepo-pnpm.md) | Monorepo com Turborepo + PNPM | ✅ |
| [ADR-0002](adr/0002-modular-nestjs-before-microservices.md) | NestJS modular antes de microsserviços | ✅ |
| [ADR-0003](adr/0003-better-auth-plus-platform-authorization.md) | Better Auth + autorização própria | ✅ |
| [ADR-0004](adr/0004-orpc-contract-first-api.md) | oRPC contract-first API | ✅ |
| [ADR-0005](adr/0005-prisma-postgresql-system-of-record.md) | Prisma + PostgreSQL como sistema de registo | ✅ |
| [ADR-0006](adr/0006-infrastructure-dependency-exceptions.md) | Excepções de dependências de infra | ✅ |
| [ADR-0007](adr/0007-api-versioning-strategy.md) | Estratégia de versionamento de API | ✅ |
| [ADR-0008](adr/0008-cargo-tracking-event-driven-handoff.md) | Handoff Cargo↔Tracking orientado a eventos | ⚠️ |
| [ADR-0009](adr/0009-event-versioning.md) | Versionamento de eventos | ✅ |
| [ADR-0012](adr/0012-orpc-transport-rationale.md) | oRPC como transporte único | ✅ |
| [ADR-0013](adr/0013-event-driven-usage-tracking.md) | Usage tracking orientado a eventos | ✅ |
| [ADR-0014](adr/0014-billing-subscription-context.md) | Billing como bounded context separado | ✅ |
| [ADR-0015](adr/0015-team-scoping-model.md) | Team-based access control | ✅ |
| [ADR-0016](adr/0016-usage-metering-architecture.md) | Arquitectura de usage metering | ✅ |
| [ADR-0017](adr/0017-schema-additions-billing-teams-sso.md) | Schema additions (billing, teams, SSO) | ✅ |

### 🔒 Segurança
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Auth Security Strategy](security/auth-security-strategy.md) | Estratégia completa de auth/security | ✅ |
| [Auth Context](security/auth-context.md) | Contrato do contexto de autenticação | ✅ |
| [Authorization Policy](security/authorization-policy.md) | Política de autorização RBAC/ABAC | ✅ |
| [Permission Resolution](security/permission-resolution.md) | Resolução de permissões | ✅ |
| [Session Resolution](security/session-resolution.md) | Resolução de sessão | ✅ |
| [HTTP Security Headers](security/http-security-headers.md) | Headers de segurança HTTP | ✅ |
| [Network Policy](security/network-policy.md) | Política de rede Kubernetes | ✅ |
| [Admission Control](security/admission-control.md) | Controlo de admissão Kubernetes | ✅ |
| [Service Accounts](security/service-accounts.md) | Contas de serviço e API keys | ✅ |

### 🗄️ Base de Dados
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Database Strategy](database/database-strategy.md) | Estratégia de base de dados | ✅ |
| [Schema Alignment Report](database/schema-alignment-report.md) | Relatório de alinhamento de schema | ✅ |
| [Audit Trail](database/audit-trail.md) | Implementação de audit trail | ✅ |
| [RBAC Bootstrap](database/rbac-bootstrap.md) | Bootstrap de RBAC | ✅ |
| [Backup & Restore Runbook](database/backup-restore-runbook.md) | Runbook de backup/restore | ✅ |
| [Migration Runbook](database/migration-runbook.md) | Runbook de migrações | ✅ |

### 🎨 Design System & UI
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Design System Strategy](design-system/design-system-strategy.md) | Estratégia do design system | ✅ |
| [Design Tokens](design-system/tokens.md) | Tokens de design | ✅ |
| [shadcn/ui Foundation](design-system/shadcn-foundation.md) | Fundação shadcn/ui | ✅ |
| [Base Primitives](design-system/base-primitives.md) | Primitivas base | ✅ |
| [WCAG Audit](design-system/wcag-audit.md) | Auditoria de acessibilidade WCAG | ✅ |
| [Component Patterns](design/component-patterns.md) | Padrões de componentes | ✅ |
| [Iconography Standards](design/iconography-standards.md) | Padrões de iconografia | ✅ |
| [Visual Identity Audit](design/visual-identity-audit.md) | Auditoria de identidade visual | ✅ |

### 📱 UI Specifications
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Billing Overview](design/ui-specs/billing-overview.md) | Spec UI da página de facturação | ✅ |
| [SSO Configuration](design/ui-specs/sso-config.md) | Spec UI da página de SSO | ✅ |
| [Subscription Management](design/ui-specs/subscription-management.md) | Spec UI de gestão de subscrição | ✅ |
| [Team Switcher](design/ui-specs/team-switcher.md) | Spec UI do team switcher | ✅ |

### 📊 Produto & Negócio
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Product Vision & OKRs](product/product-vision-okrs.md) | Visão do produto e OKRs | ✅ |
| [Personas](product/personas.md) | Personas de utilizador | ✅ |
| [Journey Maps](product/journey-maps.md) | Mapas de jornada | ✅ |
| [User Flows](product/user-flows.md) | Fluxos de utilizador | ✅ |
| [Design Principles](product/design-principles.md) | Princípios de design | ✅ |
| [Interaction Patterns](product/interaction-patterns.md) | Padrões de interacção | ✅ |
| [Product Backlog](product/product-backlog.md) | Backlog do produto | ✅ |
| [Analytics Events](product/analytics-events.md) | Taxonomia de eventos de analytics (PostHog) | ✅ |
| [Business Rules: Billing](business-rules/billing.md) | Regras de negócio de facturação | ⚠️ |
| [Business Rules: Auth](business-rules/authentication.md) | Regras de negócio de autenticação | ✅ |
| [Business Rules: Authorization](business-rules/authorization.md) | Regras de negócio de autorização | ✅ |
| [Business Rules: Tenant](business-rules/tenant.md) | Regras de negócio multi-tenant | ✅ |
| [Business Rules: Organization Lifecycle](business-rules/organization-lifecycle.md) | Ciclo de vida da organização | ✅ |
| [Business Rules: Subscription](business-rules/subscription.md) | Regras de subscrição | ⚠️ |
| [Business Rules: User Lifecycle](business-rules/user-lifecycle.md) | Ciclo de vida do utilizador | ✅ |
| [Business Rules: Global](business-rules/global.md) | Regras globais da plataforma | ✅ |

### 📈 Observabilidade
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Observability Strategy](observability/observability-strategy.md) | Estratégia de observabilidade | ✅ |
| [SLIs/SLOs](observability/slos.md) | SLIs e SLOs para caminhos críticos | ✅ |
| [SLI/SLO Original](observability/sli-slo.md) | Documento SLI/SLO v1 | ⚠️ |
| [API Instrumentation](observability/api-instrumentation.md) | Instrumentação da API | ✅ |
| [Error Handling](observability/error-handling.md) | Estratégia de tratamento de erros | ✅ |
| [Alert Routing](observability/alert-routing.md) | Roteamento de alertas | ✅ |
| [Observability Contracts](observability/contracts.md) | Contratos de observabilidade | ✅ |

### 🚀 DevOps & Deployment
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [DevOps Strategy](devops/devops-strategy.md) | Estratégia de DevOps | ✅ |
| [Deployment Strategy](devops/deployment-strategy.md) | Estratégia de deployment | ✅ |
| [Environment Strategy](devops/environment-strategy.md) | Estratégia de ambientes | ✅ |
| [Secrets Strategy](devops/secrets-strategy.md) | Estratégia de secrets | ✅ |
| [External Secrets Strategy](devops/external-secrets-strategy.md) | Estratégia External Secrets Operator | ✅ |
| [Container Registry](devops/container-registry.md) | Registry de contentores | ✅ |
| [TLS/Ingress Strategy](devops/tls-ingress-strategy.md) | Estratégia de TLS e Ingress | ✅ |
| [Cluster Readiness](devops/cluster-readiness.md) | Readiness do cluster | ✅ |
| [Runtime Readiness](devops/runtime-readiness.md) | Readiness runtime | ✅ |
| [Runtime Resilience](devops/runtime-resilience.md) | Resiliência runtime | ✅ |
| [Resource Governance](devops/resource-governance.md) | Governança de recursos | ✅ |
| [Smoke Test Strategy](devops/smoke-test-strategy.md) | Estratégia de smoke tests | ✅ |
| [Supply Chain Security](devops/supply-chain-security.md) | Segurança da cadeia de fornecimento | ✅ |
| [Disaster Recovery](devops/disaster-recovery-strategy.md) | Recuperação de desastres | ✅ |
| [Production Cutover Handoff](devops/production-cutover-handoff.md) | Handoff de cutover produção | ✅ |

### 🧪 QA & Testing
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Testing Strategy](qa/testing-strategy.md) | Estratégia de testes | ✅ |
| [Automation Plan](qa/automation-plan.md) | Plano de automação de testes | ✅ |
| [Coverage Gaps](qa/coverage-gaps.md) | Gaps de cobertura de testes | ✅ |
| [Critical User Paths](qa/critical-user-paths.md) | Caminhos críticos de utilizador | ✅ |

### 📐 Runbooks Operacionais
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [Billing Runbook](runbooks/billing.md) 🆕 | Operações de facturação e Stripe | 🆕 |
| [Deployment Runbook](runbooks/deployment.md) 🆕 | Processo de deployment completo | 🆕 |
| [Release Runbook](runbooks/release-runbook.md) | Processo de release | ✅ |
| [Rollback Runbook](runbooks/rollback-runbook.md) | Procedimento de rollback | ✅ |
| [Observability Runbook](runbooks/observability-runbook.md) | Operações de observabilidade | ✅ |
| [AI Execution Runbook](runbooks/ai-execution-runbook.md) | Execução de workflows AI | ✅ |
| [Incident to Diagnostic](runbooks/incident-to-diagnostic-runbook.md) | Fluxo incidente→diagnóstico | ✅ |
| [Backup & Restore](database/backup-restore-runbook.md) | Backup e restauro de BD | ✅ |
| [Database Migration](database/migration-runbook.md) | Migrações de base de dados | ✅ |

### 🛠️ Guias de Configuração
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [SSO Configuration Guide](guides/sso-configuration.md) 🆕 | Configuração de SSO/SAML para admins | 🆕 |
| [Team Switcher Spec](design/ui-specs/team-switcher.md) | Configuração de equipas | ✅ |

### 📋 Governança
| Documento | Descrição | Estado |
|-----------|-----------|--------|
| [SAPTM Governance Framework](governance/saptm-governance-framework.md) | Framework de governança | ✅ |
| [Engineering Governance](governance/engineering-governance.md) | Governança de engenharia | ✅ |
| [Release Governance](governance/release-governance.md) | Governança de releases | ✅ |
| [Architecture Governance](governance/architecture-governance.md) | Governança de arquitectura | ✅ |
| [Security Governance](governance/security-governance.md) | Governança de segurança | ✅ |
| [AI Governance](governance/ai-governance.md) | Governança de AI | ✅ |
| [Operating Model](governance/operating-model.md) | Modelo operacional | ✅ |
| [Approval Matrix](governance/approval-matrix.md) | Matriz de aprovações | ✅ |
| [Stabilization Policy](governance/stabilization-policy.md) | Política de estabilização | ✅ |

### 🔄 Handoffs (Pipeline)
| Documento | Origem → Destino | Estado |
|-----------|------------------|--------|
| [Stage 1 → 2](handoffs/stage-1-product-to-architecture.md) | Product → Architecture | ✅ |
| [Stage 2 → 3](handoffs/stage-2-architecture-to-visual-design.md) | Architecture → Visual Design | ✅ |
| [Stage 3 → 4](handoffs/stage-3-visual-design-to-backend.md) | Visual Design → Backend | ✅ |
| [Stage 4 → 5](handoffs/stage-4-backend-to-frontend.md) | Backend → Frontend | ✅ |
| [Stage 5 → 6](handoffs/stage-5-frontend-to-qa.md) | Frontend → QA | ✅ |
| [Stage 6 → 7](handoffs/stage-6-qa-to-security.md) | QA → Security | ✅ |
| [Stage 7 → 8](handoffs/stage-7-security-to-performance.md) | Security → Performance | ✅ |
| [Stage 8 → 9](handoffs/stage-8-performance-to-documentation.md) | Performance → Documentation | ✅ |
| [Stage 9 → 10](handoffs/stage-9-documentation-to-design-qa.md) 🆕 | Documentation → Design QA | 🆕 |

## Estrutura de Diretorias

```
docs/
├── README.md                  # Portal de documentação (este ficheiro)
├── adr/                       # Architecture Decision Records (15)
├── architecture/              # Documentação de arquitectura (22)
├── audit/                     # Relatórios de auditoria
├── business-rules/            # Regras de negócio (8)
├── database/                  # Documentação de base de dados (6)
├── deploy/                    # Configuração de deploy
├── design/                    # Especificações de design e UI (7)
├── design-system/             # Documentação do design system (5)
├── devops/                    # Documentação de DevOps (16)
├── diagnostics/               # Diagnósticos de domínios (16)
├── discovery/                 # Documentos de descoberta
├── enterprise/                # Documentação enterprise (14)
├── features/                  # Documentação de funcionalidades (19)
├── flows/                     # Fluxos de trabalho operacionais (14)
├── frontend/                  # Documentação frontend
├── governance/                # Governança e gates (30)
├── guides/                    # Guias de configuração
├── handoffs/                  # Handoffs entre stages (9)
├── observability/             # Observabilidade (7)
├── product/                   # Documentação de produto (9)
├── qa/                        # Qualidade e testes (4)
├── roadmaps/                  # Roadmaps e planos (11)
├── rpc/                       # Documentação RPC (2)
├── runbooks/                  # Runbooks operacionais (7)
├── security/                  # Documentação de segurança (9)
├── skills/                    # Skills de agentes AI (12)
├── standards/                 # Padrões técnicos (18)
├── testing/                   # Estratégia de testes
└── workspace/                 # Estratégia monorepo
```

## Documentos Arquivo (Históricos)

Documentos em `docs/enterprise/archive/` e `docs/diagnostics/` contêm relatórios históricos de auditoria e diagnóstico. Estes documentos reflectem o estado anterior do sistema e podem conter referências desactualizadas.

## Legenda de Estados

| Símbolo | Significado |
|---------|-------------|
| ✅ | Actualizado — reflecte o estado actual do código |
| ⚠️ | Precisa de revisão — pode estar desactualizado |
| 🆕 | Novo documento — criado nesta iteração |
| ❌ | Descontinuado — já não aplicável |

## Manutenção

Este portal é mantido pelo Departamento de Documentação (`@enterprise-documentation`). Para contribuir:

1. Actualizar documentos relevantes ao fazer alterações de código
2. Verificar broken links com `pnpm docs:check-links` (quando disponível)
3. Manter o ficheiro `AGENTS.md` actualizado com o estado das sprints
4. Executar o Design QA (`@enterprise-design-qa`) antes de entregar alterações de UI

## Documentos por Departamento

### Product
`product/`, `business-rules/`, `roadmaps/`, `features/`

### UX Research
`product/personas.md`, `product/journey-maps.md`, `product/user-flows.md`

### Visual Design
`design/`, `design-system/`, `design/ui-specs/`

### Frontend
`frontend/`, `standards/nextjs.md`, `standards/react.md`, `standards/shadcn-ui.md`

### Backend
`rpc/`, `standards/nestjs.md`, `standards/orpc.md`, `business-rules/`, `features/`

### Database
`database/`, `standards/prisma.md`

### Enterprise Architecture
`architecture/`, `adr/`, `enterprise/`

### Security
`security/`, `standards/security.md`

### DevOps
`devops/`, `deploy/`, `standards/turborepo.md`

### QA
`qa/`, `testing/`, `standards/testing.md`

### Performance
`observability/`

### Documentation
`README.md`, `AGENTS.md`, `standards/documentation-standards.md`

---

**Departamento de Documentação** — `@enterprise-documentation`
