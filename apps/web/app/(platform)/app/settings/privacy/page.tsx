import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import { AccountDeletionForm } from "../../../../../components/privacy/account-deletion-form";
import { DataExportForm } from "../../../../../components/privacy/data-export-form";
import { requirePlatformSession } from "../../../../../lib/auth-session";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const platformSession = await requirePlatformSession("/app/settings/privacy");

  return (
    <main className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">RGPD</Badge>
          <Badge variant="outline">Lei 58/2019</Badge>
          <Badge variant={platformSession.viewer.emailVerified ? "success" : "warning"}>
            {platformSession.viewer.emailVerified ? "Email verificado" : "Email pendente"}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-semibold text-3xl tracking-tight">Privacidade e dados pessoais</h1>
          <p className="mt-2 text-muted-foreground">
            Gere os seus dados pessoais conforme o Regulamento Geral de Proteção de Dados (RGPD). Pode
            exportar uma cópia completa ou solicitar a eliminação da sua conta.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exportar dados</CardTitle>
            <CardDescription>
              Descarregue todos os dados pessoais associados a sua conta, incluindo registos de
              auditoria e sessões ativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataExportForm viewerEmail={platformSession.viewer.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eliminar conta</CardTitle>
            <CardDescription>
              Solicite a eliminação permanente da sua conta e dados associados. Esta ação é
              irreversível e passível de auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountDeletionForm viewerEmail={platformSession.viewer.email} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
