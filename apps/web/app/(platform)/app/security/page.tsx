import { getUserSessionSecuritySummaryFromEnv } from "@saptm/auth";
import { Badge, MetricTile } from "@saptm/ui";

import type { Metadata } from "next";
import { MfaEnrollmentForm } from "../../../../components/security/mfa-enrollment-form";
import { SessionRevocationForm } from "../../../../components/security/session-revocation-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { revokeOtherSessionsAction } from "./actions";
import { initialSessionRevocationFormState } from "./form-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Segurança",
  description: "Centro de segurança da conta, sessões ativas e configuração de MFA.",
};

export default async function SecurityPage() {
  const platformSession = await requirePlatformSession("/app/security");
  const sessionSummary = await getUserSessionSecuritySummaryFromEnv({
    currentSessionId: platformSession.sessionId,
    userId: platformSession.viewer.id,
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Autenticação</Badge>
          <Badge variant="success">Sessão autenticada</Badge>
          <Badge variant={platformSession.viewer.emailVerified ? "success" : "warning"}>
            {platformSession.viewer.emailVerified ? "Email verificado" : "Email pendente"}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-semibold text-3xl tracking-heading">Segurança da conta</h1>
          <p className="mt-2 text-muted-foreground">
            Centro de segurança do utilizador autenticado: sessão atual, revogação de outras sessões
            e configuração de MFA.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Sessões ativas" value={sessionSummary.activeSessions.toString()} />
        <MetricTile label="Outras sessões" value={sessionSummary.otherSessions.toString()} />
        <MetricTile
          label="MFA"
          value={platformSession.viewer.twoFactorEnabled ? "ativo" : "inativo"}
          badge={platformSession.viewer.twoFactorEnabled ? "Ativo" : "Inativo"}
          variant={platformSession.viewer.twoFactorEnabled ? "secondary" : "outline"}
        />
        <MetricTile label="Ambiente" value="Produção" badge="Online" variant="secondary" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SessionRevocationForm
          action={revokeOtherSessionsAction}
          activeSessions={sessionSummary.activeSessions}
          initialState={initialSessionRevocationFormState}
          otherSessions={sessionSummary.otherSessions}
        />

        <MfaEnrollmentForm
          email={platformSession.viewer.email}
          initialEnabled={platformSession.viewer.twoFactorEnabled}
        />
      </section>
    </div>
  );
}
