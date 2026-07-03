import type { ReportExportDomain } from "@saptm/rpc";
import { AccessState, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import { ArrowRight, Box, Container, DollarSign, Gauge, Route } from "lucide-react";
import type { Metadata, Route as RouteType } from "next";
import Link from "next/link";
import React from "react";
import { requirePlatformSession } from "../../../../lib/auth-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Exportação de relatórios operacionais em CSV por domínio.",
};

const domainLabels: Record<ReportExportDomain, string> = {
  tracking: "Tracking / Expedições",
  cargo: "Cargas",
  capacity: "Capacidade / Slots",
  planning: "Planeamento / Ordens de Transporte",
  tariff: "Tarifas / Tabelas de Preços",
};

const domainIcons: Record<ReportExportDomain, React.ReactNode> = {
  tracking: <Container className="size-5" />,
  cargo: <Box className="size-5" />,
  capacity: <Gauge className="size-5" />,
  planning: <Route className="size-5" />,
  tariff: <DollarSign className="size-5" />,
};

export default async function ReportsPage() {
  const platformSession = await requirePlatformSession("/app/reports");

  const hasExportPermission = platformSession.viewer.permissions.includes("report.export");

  if (!hasExportPermission) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-heading">Relatórios operacionais</h1>
          <p className="mt-1 text-muted-foreground text-sm">Exportações CSV com auditoria.</p>
        </div>
        <AccessState
          badgeLabel="Exportação"
          description="Contacte o gestor de operações para solicitar acesso à exportação de relatórios."
          title="Exportação indisponível"
          variant="blocked"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-heading">Relatórios operacionais</h1>
        <p className="text-muted-foreground">
          Exportações CSV com auditoria e integrações.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["tracking", "cargo", "capacity", "planning", "tariff"] as ReportExportDomain[]).map(
          (domain) => (
            <Link
              key={domain}
              href={`/app/reports/export?domain=${domain}` as RouteType}
              className="block rounded-lg outline-none transition-colors hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Card className="h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {domainIcons[domain]}
                    {domainLabels[domain]}
                  </CardTitle>
                  <CardDescription>
                    Exportar CSV até 100 registos do módulo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 font-medium text-primary text-sm">Exportar CSV <ArrowRight className="size-3" /></span>
                </CardContent>
              </Card>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
