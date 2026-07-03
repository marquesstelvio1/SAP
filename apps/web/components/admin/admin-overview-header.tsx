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
};

export function AdminOverviewHeader({ totals, organization }: AdminOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Administração</Badge>
            <Badge variant="outline">Controlo de acesso</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl">Administração</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Gestão de organização, utilizadores, perfis e permissões.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Utilizadores" value={totals.users.toString()} />
          <MetricTile label="Ativos" value={totals.activeMemberships.toString()} />
          <MetricTile label="Convites" value={totals.invitedMemberships.toString()} />
          <MetricTile label="Perfis" value={totals.roles.toString()} />
          <MetricTile label="Permissões" value={totals.permissions.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organização</CardTitle>
          <CardDescription>Detalhes da organização da sessão atual.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ContextRow label="Nome" value={organization.name} />
          <ContextRow
            label="Estado"
            value={
              organizationStatusLabels[organization.status as keyof typeof organizationStatusLabels]
            }
          />
          <ContextRow label="Atualizado" value={organization.updatedAt} />
        </CardContent>
      </Card>
    </section>
  );
}
