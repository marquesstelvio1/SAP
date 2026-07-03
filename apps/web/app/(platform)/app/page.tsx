import type { PlatformPermission } from "@saptm/auth";
import { AccessState, Badge, Button } from "@saptm/ui";
import type { Metadata, Route } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { requirePlatformSession } from "../../../lib/auth-session";

const OperationsSnapshot = nextDynamic(() =>
  import("./operations-snapshot").then((mod) => mod.OperationsSnapshot),
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de operações",
  description:
    "Vista geral das operações de carga, tracking, planeamento e capacidade da plataforma SAPTM.",
};

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";

export default async function PlatformAppPage() {
  const platformSession = await requirePlatformSession("/app");
  const viewerPermissions = platformSession.viewer.permissions;
  const canReadTracking = viewerPermissions.includes(readTrackingPermission);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Operacional</Badge>
          {canReadTracking ? (
            <Badge variant="info">Tracking activo</Badge>
          ) : (
            <Badge variant="outline">Tracking indisponível</Badge>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-3xl tracking-heading">Painel de operações</h1>
          <p className="max-w-3xl text-muted-foreground">
            Resumo das operações de carga, tracking e planeamento.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {[
          { label: "Cargas", href: "/app/cargo", permission: "cargo.read" as PlatformPermission },
          {
            label: "Tracking",
            href: "/app/tracking",
            permission: "tracking.shipment.read" as PlatformPermission,
          },
          {
            label: "Capacidade",
            href: "/app/capacity",
            permission: "capacity.read" as PlatformPermission,
          },
          {
            label: "Planeamento",
            href: "/app/planning",
            permission: "planning.order.read" as PlatformPermission,
          },
          {
            label: "Tarifas",
            href: "/app/tariffs",
            permission: "tariff.read" as PlatformPermission,
          },
        ].map((item) =>
          viewerPermissions.includes(item.permission) ? (
            <Button key={item.href} asChild size="sm" variant="outline">
              <Link href={item.href as Route}>{item.label}</Link>
            </Button>
          ) : null,
        )}
      </div>

      <Suspense
        fallback={
          <AccessState
            badgeLabel="Resumo operacional"
            description="A carregar dados de tracking operacional..."
            title="A carregar resumo operacional"
          />
        }
      >
        <OperationsSnapshot canReadTracking={canReadTracking} />
      </Suspense>
    </div>
  );
}
