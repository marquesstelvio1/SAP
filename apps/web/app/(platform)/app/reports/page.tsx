import type { ReportExportDomain } from "@saptm/rpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@saptm/ui";
import { Box, Container, Gauge, Route, DollarSign } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { requirePlatformSession } from "../../../../lib/auth-session";

export const dynamic = "force-dynamic";

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
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Relatórios operacionais</h1>
          <p className="mt-1 text-muted-foreground text-sm">Exportações CSV com auditoria.</p>
        </div>
        <EmptyState
          title="Exportação indisponível"
          description="Contacte o gestor de operações para solicitar acesso à exportação de relatórios."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Relatórios operacionais</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Exportações CSV com auditoria e integrações.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["tracking", "cargo", "capacity", "planning", "tariff"] as ReportExportDomain[]).map(
          (domain) => (
            <Link
              key={domain}
              href={`/app/reports/export?domain=${domain}` as Route}
              className="block rounded-lg outline-none transition-colors hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Card className="h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {domainIcons[domain]}
                    {domainLabels[domain]}
                  </CardTitle>
                  <CardDescription>
                    Exportar CSV até 100 registos do domínio {domainLabels[domain]}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="font-medium text-primary text-sm">Exportar CSV &rarr;</span>
                </CardContent>
              </Card>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
