import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  membershipStatusLabels,
  resolveMembershipStatusVariant,
} from "../../app/(platform)/app/admin/logic";

export type PaginationState = {
  totalCount: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
};

export type AdminUsersTableProps = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
      membership: {
        id: string;
        status: string;
        roles: Array<{ id: string; key: string; name: string }>;
      };
  }>;
  pagination: PaginationState;
};

function buildPageNumbers(totalPages: number, currentPage: number): (number | "...")[] {
  const delta = 2;
  const range: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }
  return range;
}

export function AdminUsersTable({ users, pagination }: AdminUsersTableProps) {
  const buildPageUrl = (pageOffset: number): Route =>
    `?offset=${pageOffset}&limit=${pagination.limit}` as Route;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilizadores e memberships</CardTitle>
        <CardDescription>
          Lista de utilizadores com estado, verificação de email e permissões atribuídas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Utilizadores e memberships">
          <TableHeader>
            <TableRow>
              <TableHead>Utilizador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.membership.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={resolveMembershipStatusVariant(
                      user.membership.status as keyof typeof membershipStatusLabels,
                    )}
                  >
                    {
                      membershipStatusLabels[
                        user.membership.status as keyof typeof membershipStatusLabels
                      ]
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{user.email}</span>
                    <span className="text-muted-foreground text-xs">
                      {user.emailVerified ? "Email verificado" : "Email pendente"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.membership.roles.length === 0 ? (
                      <Badge variant="warning">Sem role</Badge>
                    ) : (
                      user.membership.roles.map((role) => (
                        <Badge key={role.id} variant="outline">
                          {role.name ?? role.key}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {pagination.totalPages > 1 && (
        <CardFooter>
          <Pagination>
            <PaginationContent>
              {pagination.currentPage > 1 && (
                <PaginationItem>
                  <Link href={buildPageUrl(pagination.offset - pagination.limit)}>
                    <PaginationPrevious />
                  </Link>
                </PaginationItem>
              )}
              {buildPageNumbers(pagination.totalPages, pagination.currentPage).map((page) =>
                page === "..." ? (
                  <PaginationItem key="ellipsis">
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <Link href={buildPageUrl(((page as number) - 1) * pagination.limit)}>
                      <PaginationLink isActive={page === pagination.currentPage}>
                        {page}
                      </PaginationLink>
                    </Link>
                  </PaginationItem>
                ),
              )}
              {pagination.currentPage < pagination.totalPages && (
                <PaginationItem>
                  <Link href={buildPageUrl(pagination.offset + pagination.limit)}>
                    <PaginationNext />
                  </Link>
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
}
