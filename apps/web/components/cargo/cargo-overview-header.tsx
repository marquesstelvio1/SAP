import type { PlatformPermission } from "@saptm/auth";
import {
  BadgeGroup,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export type CargoOverviewHeaderProps = {
  totals: {
    cargo: number;
    activeCargo: number;
    heldCargo: number;
    hazardousCargo: number;
    inspectionRequiredCargo: number;
  };
  organizationId: string;
  sessionId: string;
  permissions: {
    readCargoPermission: PlatformPermission;
    registerCargoPermission: PlatformPermission;
    departCargoTransportPermission: PlatformPermission;
    arriveCargoTransportPermission: PlatformPermission;
    recordCargoOperationalHandoffPermission: PlatformPermission;
    recordCargoClaimSettlementPermission: PlatformPermission;
    completeCargoDeliveryPermission: PlatformPermission;
    recordCargoDeliveryExceptionPermission: PlatformPermission;
    recordComplianceEvidencePermission: PlatformPermission;
  };
};

export function CargoOverviewHeader({
  totals,
  organizationId,
  sessionId,
  permissions,
}: CargoOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <BadgeGroup
            items={[
              { label: "Business P0", variant: "success" },
              { label: "Gestao de Cargas", variant: "outline" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl">Registo governado de cargas</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Cargas sao registadas com identidade unica por tenant, custodia, origem, destino,
              compliance aduaneiro, regras de perigosidade, bloqueios de movimento, audit trail e
              outbox. Nao existe CRUD generico nesta fatia.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Cargas" value={totals.cargo.toString()} />
          <MetricTile label="Ativas" value={totals.activeCargo.toString()} />
          <MetricTile label="Bloqueadas" value={totals.heldCargo.toString()} />
          <MetricTile label="Perigosas" value={totals.hazardousCargo.toString()} />
          <MetricTile label="Inspecao" value={totals.inspectionRequiredCargo.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contexto de seguranca</CardTitle>
          <CardDescription>Escopo resolvido por Better Auth, RBAC e organizacao.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ContextRow label="Organization" value={organizationId} />
          <ContextRow label="Session" value={sessionId} />
          <ContextRow label="Leitura" value={permissions.readCargoPermission} />
          <ContextRow label="Registo" value={permissions.registerCargoPermission} />
          <ContextRow label="Partida" value={permissions.departCargoTransportPermission} />
          <ContextRow label="Handoff" value={permissions.recordCargoOperationalHandoffPermission} />
          <ContextRow label="Claims" value={permissions.recordCargoClaimSettlementPermission} />
          <ContextRow label="Chegada" value={permissions.arriveCargoTransportPermission} />
          <ContextRow label="Entrega" value={permissions.completeCargoDeliveryPermission} />
          <ContextRow label="Excecao" value={permissions.recordCargoDeliveryExceptionPermission} />
          <ContextRow label="Compliance" value={permissions.recordComplianceEvidencePermission} />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/app/audit?action=cargo.&subjectType=cargo&limit=25` as Route}>
                Auditoria de cargas
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={"/app/reports" as Route}>Relatorios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
