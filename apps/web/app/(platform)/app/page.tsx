import type { PlatformPermission } from "@saptm/auth";
import {
  AccessState,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricTile,
} from "@saptm/ui";
import type { Metadata, Route } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { requirePlatformSession } from "../../../lib/auth-session";
import { resolvePlatformNavigation } from "../../../lib/platform-navigation";

const OperationsSnapshot = nextDynamic(() =>
  import("./operations-snapshot").then((mod) => mod.OperationsSnapshot),
);

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Vista geral das operações de carga, tracking, planeamento e capacidade da plataforma SAPTM.",
};

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";

export default async function PlatformAppPage() {
  const platformSession = await requirePlatformSession("/app");
  const viewerPermissions = platformSession.viewer.permissions;
  const canReadTracking = viewerPermissions.includes(readTrackingPermission);

  const moduleCount = [
    "cargo.read",
    "tracking.shipment.read",
    "planning.order.read",
    "capacity.read",
    "tariff.read",
  ].filter((p) => viewerPermissions.includes(p as PlatformPermission)).length;

  const resolvedNav = resolvePlatformNavigation(viewerPermissions);
  const operationalItems = resolvedNav.find((g) => g.label === "Operações")?.items ?? [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Operacional</Badge>
              {canReadTracking ? (
                <Badge variant="info">Tracking activo</Badge>
              ) : (
                <Badge variant="outline">Tracking indisponível</Badge>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle as="h1" className="text-2xl">
                Dashboard
              </CardTitle>
              <CardDescription className="max-w-3xl leading-6">
                Vista geral das operações de carga, tracking e planeamento.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <MetricTile label="Módulos activos" value={`${moduleCount}/5`} />
            <MetricTile
              label="Tracking"
              value={canReadTracking ? "Autorizado" : "Indisponível"}
              badge={canReadTracking ? "OK" : "Indisponível"}
              variant={canReadTracking ? "success" : "warning"}
            />
            <MetricTile label="Plataforma" value="SAPTM" badge="Online" variant="success" />
            <MetricTile label="Organização" value="Ativa" badge="Online" variant="success" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modulos operacionais</CardTitle>
            <CardDescription>Acesso rápido às principais funcionalidades.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {operationalItems.map((item) => (
              <div className="flex justify-between" key={item.href}>
                <span className="text-muted-foreground">{item.label}</span>
                {item.allowed ? (
                  <Button asChild size="sm" variant="outline">
                    <Link aria-label={`Abrir ${item.label}`} href={item.href as Route}>
                      Abrir
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="outline">Indisponível</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Suspense
        fallback={
          <AccessState
            badgeLabel="Resumo Operacional"
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
