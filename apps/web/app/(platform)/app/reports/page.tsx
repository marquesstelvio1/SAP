import type { ReportExportDomain } from "@saptm/rpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@saptm/ui";
import { BoxIcon, ContainerIcon, GaugeIcon, RouteIcon, DollarSignIcon } from "lucide-react";
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
  tracking: <ContainerIcon className="size-5" />,
  cargo: <BoxIcon className="size-5" />,
  capacity: <GaugeIcon className="size-5" />,
  planning: <RouteIcon className="size-5" />,
  tariff: <DollarSignIcon className="size-5" />,
};

export default async function ReportsPage() {
  const platformSession = await requirePlatformSession("/app/reports");

  const hasExportPermission = platformSession.viewer.permissions.includes("report.export");

  if (!hasExportPermission) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Reports operacionais</h1>
          <p className="mt-1 text-muted-foreground text-sm">Exportacoes CSV com auditoria.</p>
        </div>
        <EmptyState
          title="Exportacao indisponivel"
          description="Contacte o gestor de operacoes para solicitar acesso a exportacao de reports."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Reports operacionais</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Exportacoes CSV com auditoria e integracoes.
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
                    Exportar CSV ate 100 registos do dominio {domainLabels[domain]}.
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
