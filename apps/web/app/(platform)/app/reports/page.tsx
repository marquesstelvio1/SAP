import type { ReportExportDomain } from "@saptm/rpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { requirePlatformSession } from "../../../../lib/auth-session";

export const dynamic = "force-dynamic";

const domainLabels: Record<ReportExportDomain, string> = {
  tracking: "Tracking / Shipments",
  cargo: "Cargas",
  capacity: "Capacidade / Slots",
  planning: "Planeamento / Transport Orders",
  tariff: "Tarifas / Rate Cards",
};

const domainIcons: Record<ReportExportDomain, string> = {
  tracking: "📦",
  cargo: "🚛",
  capacity: "📊",
  planning: "📋",
  tariff: "💰",
};

export default async function ReportsPage() {
  const platformSession = await requirePlatformSession("/app/reports");

  const hasExportPermission = platformSession.viewer.permissions.includes("report.export");

  if (!hasExportPermission) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Reports operacionais</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Exportacoes CSV governadas e auditaveis.
          </p>
        </div>
        <EmptyState
          title="Sem permissao report.export"
          description="Contacte o administrador da organizacao para solicitar acesso a exportacao de reports."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Reports operacionais</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Exportacoes CSV governadas e auditaveis com outbox para integracoes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["tracking", "cargo", "capacity", "planning", "tariff"] as ReportExportDomain[]).map(
          (domain) => (
            <Link
              key={domain}
              href={`/app/reports/export?domain=${domain}` as Route}
              className="block transition-colors hover:opacity-80"
            >
              <Card className="h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span>{domainIcons[domain]}</span>
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
