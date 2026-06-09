# App Shell Foundation

## Objetivo

Fechar a base local de frontend antes de expandir regras de negocio, CRUD ou multiplos dominios.

## Escopo P1 Fechado

- Shell autenticado em `apps/web/app/(platform)/layout.tsx`.
- Redirect seguro de `/` para `/sign-in` ou `/app`.
- Login real via Better Auth em `apps/web/app/sign-in/sign-in-form.tsx`.
- Sessao server-side com `auth.api.getSession` em `apps/web/lib/auth-session.ts`.
- RBAC resolvido por membership/roles em `packages/auth/src/user-authorization.ts`.
- Navegacao com gates de permissao em `apps/web/lib/platform-navigation.ts`.
- Design System aplicado com primitives de `@saptm/ui`.
- Control Center em `/app` com estados reais de sessao, tenant, RBAC e tracking overview quando autorizado.

## Bloqueio de Negocio

O shell permite apenas a primeira feature modular aceita: Operational Tracking.

Continuam bloqueados:

- CRUD generico.
- Multiplos dominios simultaneos.
- Telas sem permissao explicita.
- Analytics e IA antes de audit trail, aprovacao humana e evidencia operacional.

## Gate Local

Executar:

```bash
pnpm validate:ui-foundation
pnpm validate:local-readiness
pnpm typecheck
pnpm build
```

O app so deve avancar para nova feature de negocio quando esses gates estiverem verdes.
