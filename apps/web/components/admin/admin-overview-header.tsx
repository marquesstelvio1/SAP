import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
} from "@saptm/ui";
import { organizationStatusLabels } from "../../app/(platform)/app/admin/logic";

export type AdminOverviewHeaderProps = {
  totals: {
    users: number;
    activeMemberships: number;
    invitedMemberships: number;
    roles: number;
    permissions: number;
  };
  organization: { name: string; slug: string; status: string; id: string; updatedAt: string };
  securityModel: { authorizationModel: string };
};

export function AdminOverviewHeader({
  totals,
  organization,
  securityModel,
}: AdminOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Admin P1</Badge>
            <Badge variant="outline">Better Auth + RBAC</Badge>
            <Badge variant="outline">{securityModel.authorizationModel}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl">Administracao de identidade e RBAC</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Governanca tenant-scoped para organizacao, utilizadores, memberships, roles e
              permissoes. Convites e atribuicoes passam por oRPC, RBAC, audit trail e outbox.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Utilizadores" value={totals.users.toString()} />
          <MetricTile label="Ativos" value={totals.activeMemberships.toString()} />
          <MetricTile label="Convites" value={totals.invitedMemberships.toString()} />
          <MetricTile label="Roles" value={totals.roles.toString()} />
          <MetricTile label="Permissoes" value={totals.permissions.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizacao</CardTitle>
          <CardDescription>Escopo administrativo resolvido da sessao atual.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ContextRow label="Nome" value={organization.name} />
          <ContextRow label="Slug" value={organization.slug} />
          <ContextRow
            label="Status"
            value={
              organizationStatusLabels[organization.status as keyof typeof organizationStatusLabels]
            }
          />
          <ContextRow label="Tenant ID" value={organization.id} />
          <ContextRow label="Atualizado" value={organization.updatedAt} />
        </CardContent>
      </Card>
    </section>
  );
}
