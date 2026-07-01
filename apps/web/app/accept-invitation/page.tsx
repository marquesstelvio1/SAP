import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@saptm/ui";

import { InvitationAcceptForm } from "../../components/auth/invitation-accept-form";
import { acceptInvitationAction } from "./actions";
import { initialAcceptInvitationFormState } from "./form-state";

export const dynamic = "force-dynamic";

type AcceptInvitationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const params = await searchParams;
  const token = readToken(params.token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground" id="main-content">
      {token.length === 0 ? (
        <Card className="w-full max-w-lg">
          <CardHeader className="gap-3">
            <Badge variant="warning">Token ausente</Badge>
            <CardTitle>Convite indisponivel</CardTitle>
            <CardDescription>
              Abra o link completo recebido por convite. Se o link expirou, solicite reenvio ao
              administrador da organização.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <InvitationAcceptForm
          action={acceptInvitationAction}
          initialState={initialAcceptInvitationFormState}
          token={token}
        />
      )}
    </main>
  );
}

function readToken(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.at(0)?.trim() ?? "";
  }

  return value?.trim() ?? "";
}
