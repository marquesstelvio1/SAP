import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";

const permissionLabels: Record<string, string> = {
  "tenant.manage": "Gerir organização",
  "identity.user.invite": "Convidar utilizadores",
  "identity.role.assign": "Atribuir roles",
  "integration.api_key.manage": "Gerir chaves API",
  "integration.event.ingest": "Ingerir eventos",
  "audit.read": "Ler auditoria",
  "report.export": "Exportar relatórios",
  "notification.read": "Ler notificações",
  "cargo.read": "Ler cargas",
  "cargo.register": "Registar cargas",
  "cargo.release": "Libertar cargas",
  "cargo.transport.plan": "Planear transporte",
  "cargo.transport.depart": "Iniciar transporte",
  "cargo.transport.arrive": "Finalizar transporte",
  "cargo.handoff.record": "Registar handoff",
  "cargo.claim.settle": "Settlar reclamação",
  "cargo.delivery.complete": "Completar entrega",
  "cargo.delivery.exception.record": "Registar excepção",
  "cargo.delivery.exception.resolve": "Resolver excepção",
  "cargo.compliance.record": "Registar compliance",
  "cargo.compliance.verify": "Verificar compliance",
  "tracking.shipment.read": "Ler tracking",
  "tracking.event.record": "Registar evento",
  "tracking.exception.manage": "Gerir excepção",
  "tracking.exception.resolve": "Resolver excepção",
  "capacity.read": "Ler capacidade",
  "capacity.manage": "Gerir capacidade",
  "capacity.slot.reserve": "Reservar slot",
  "capacity.slot.cancel": "Cancelar slot",
  "capacity.advisory.decide": "Decidir advisory",
  "planning.order.read": "Ler planeamento",
  "planning.order.confirm": "Confirmar ordem",
  "planning.order.cancel": "Cancelar ordem",
  "planning.order.reschedule": "Reagendar ordem",
  "planning.order.dispatch": "Expedir ordem",
  "tariff.read": "Ler tarifas",
  "tariff.manage": "Gerir tarifas",
  "tariff.quote.calculate": "Calcular cotação",
  "tariff.quote.approve": "Aprovar cotação",
  "billing.read": "Ler facturação",
};

export type AdminRolesTablesProps = {
  roles: Array<{
    id: string;
    name: string;
    key: string;
    protected: boolean;
    permissionCount: number;
    membershipCount: number;
    permissions: string[];
  }>;
  permissions: Array<{
    id: string;
    key: string;
    description: string | null;
    roleCount: number;
  }>;
};

export function AdminRolesTables({ roles, permissions }: AdminRolesTablesProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Roles da organização</CardTitle>
          <CardDescription>
            Templates base e contagem de permissões/membros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Roles da organização">
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Membros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {role.protected ? "template" : "custom"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <span>{role.permissionCount}</span>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map((permission) => (
                          <Badge key={permission} variant="outline">
                            {permissionLabels[permission] ?? permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 4 ? (
                          <Badge variant="secondary">+{role.permissions.length - 4}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{role.membershipCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões</CardTitle>
          <CardDescription>Catálogo completo de permissões do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Permissões">
            <TableHeader>
              <TableRow>
                <TableHead>Permissão</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{permissionLabels[permission.key] ?? permission.key}</span>
                      <span className="text-muted-foreground text-xs">
                        {permission.description ?? "Sem descrição"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{permission.roleCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
