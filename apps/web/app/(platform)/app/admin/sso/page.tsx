import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";

import { requirePlatformSession } from "../../../../../lib/auth-session";
import { SsoConfigClient } from "./sso-config-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Autenticação",
  description: "Configuração SSO/SAML e autenticação única da organização.",
};

/**
 * Página de configuração SSO ( /app/admin/sso ).
 *
 * Feature-gated: disponível apenas para plano Enterprise.
 *
 * Estados:
 * - Sem permissão tenant.manage → AccessState blocked
 * - Plano não Enterprise → AccessState blocked com CTA para planos
 * - Loading → Skeleton (loading.tsx)
 * - Erro → ErrorCard
 * - Configurado → formulário com dados existentes
 * - Não configurado → formulário vazio
 */
export default async function SsoConfigPage() {
  const platformSession = await requirePlatformSession("/app/admin/sso");

  if (!platformSession.viewer.permissions.includes("tenant.manage")) {
    return (
      <AccessState
        badgeLabel="Autenticação"
        description="O utilizador autenticado não tem permissão para configurar SSO."
        role="alert"
        title="SSO bloqueado"
        variant="blocked"
      />
    );
  }

  // Tentar carregar configuração SSO
  // O backend pode ou não ter o endpoint implementado
  return <SsoConfigClient />;
}
