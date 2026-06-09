import { getUserSessionSecuritySummaryFromEnv } from "@saptm/auth";
import { Badge, Card, CardHeader, CardTitle } from "@saptm/ui";

import { MfaEnrollmentForm } from "../../../../components/mfa-enrollment-form";
import { SessionRevocationForm } from "../../../../components/session-revocation-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { revokeOtherSessionsAction } from "./actions";
import { initialSessionRevocationFormState } from "./form-state";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const platformSession = await requirePlatformSession("/app/security");
  const sessionSummary = await getUserSessionSecuritySummaryFromEnv({
    currentSessionId: platformSession.sessionId,
    userId: platformSession.viewer.id,
  });

  return (
    <main className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Better Auth</Badge>
          <Badge variant="success">Sessao autenticada</Badge>
          <Badge variant={platformSession.viewer.emailVerified ? "success" : "warning"}>
            {platformSession.viewer.emailVerified ? "Email verificado" : "Email pendente"}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-semibold text-3xl tracking-tight">Seguranca da conta</h1>
          <p className="mt-2 text-muted-foreground">
            Centro de seguranca do utilizador autenticado: sessao atual, revogacao de outras sessoes
            e readiness para MFA com Better Auth.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SecurityMetric label="Sessoes ativas" value={sessionSummary.activeSessions.toString()} />
        <SecurityMetric label="Outras sessoes" value={sessionSummary.otherSessions.toString()} />
        <SecurityMetric
          label="MFA"
          value={platformSession.viewer.twoFactorEnabled ? "ativo" : "inativo"}
          variant={platformSession.viewer.twoFactorEnabled ? "secondary" : "outline"}
        />
        <SecurityMetric
          label="Organizacao"
          value={platformSession.viewer.organizationId ?? "sem-organizacao"}
          variant="secondary"
        />
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
    </main>
  );
}

function SecurityMetric(props: {
  label: string;
  value: string;
  variant?: "secondary" | "outline";
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Badge variant={props.variant ?? "outline"}>{props.label}</Badge>
        <CardTitle className="text-2xl">{props.value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
