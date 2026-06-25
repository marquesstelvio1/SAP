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
          <CardTitle>Roles do tenant</CardTitle>
          <CardDescription>
            Templates bootstrap e contagem de permissoes/memberships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Roles do tenant">
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permissoes</TableHead>
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
                        {role.key} &middot; {role.protected ? "template protegido" : "custom"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <span>{role.permissionCount}</span>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map((permission) => (
                          <Badge key={permission} variant="outline">
                            {permission}
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
          <CardTitle>Permissoes</CardTitle>
          <CardDescription>
            Catalogo efetivo usado pelo RBAC, APIs, navegacao e formularios governados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Permissoes">
            <TableHeader>
              <TableRow>
                <TableHead>Permissao</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{permission.key}</span>
                      <span className="text-muted-foreground text-xs">
                        {permission.description ?? "Sem descricao"}
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
