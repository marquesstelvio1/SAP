"use client";

import type { auditRecordSummarySchema } from "@saptm/rpc/audit";
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextRow,
  JsonBlock,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import { ChevronDownIcon } from "lucide-react";
import type { z } from "zod";

import { formatDateTime } from "@/lib/format";

const severityLabels = {
  critical: "Crítica",
  high: "Alta",
  low: "Baixa",
  medium: "Média",
} as const;

const actorTypeLabels = {
  ai_agent: "Agente IA",
  anonymous: "Anónimo",
  integration: "Integração",
  platform: "Plataforma",
  service_account: "Conta de Serviço",
  user: "Utilizador",
} as const;

function resolveSeverityVariant(
  severity: keyof typeof severityLabels,
): "outline" | "success" | "warning" | "destructive" {
  if (severity === "critical") {
    return "destructive";
  }

  if (severity === "high") {
    return "warning";
  }

  if (severity === "low") {
    return "success";
  }

  return "outline";
}

export function AuditRecordsTable({
  records,
}: {
  records: z.infer<typeof auditRecordSummarySchema>[];
}) {
  if (records.length === 0) {
    return (
      <Table aria-label="Registos auditados">
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Severidade</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Sujeito</TableHead>
            <TableHead>Ator</TableHead>
            <TableHead>Detalhe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} role="status">
              Nenhum registo encontrado para os filtros.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table aria-label="Registos auditados">
      <TableHeader>
        <TableRow>
          <TableHead>Quando</TableHead>
          <TableHead>Severidade</TableHead>
          <TableHead>Ação</TableHead>
          <TableHead>Sujeito</TableHead>
          <TableHead>Ator</TableHead>
          <TableHead>Detalhe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record: z.infer<typeof auditRecordSummarySchema>) => (
          <TableRow key={record.id}>
            <TableCell>{formatDateTime(record.createdAt)}</TableCell>
            <TableCell>
              <Badge variant={resolveSeverityVariant(record.severity)}>
                {severityLabels[record.severity]}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="font-medium">{record.action}</span>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span>{record.subjectType}</span>
                <span className="text-muted-foreground text-xs">
                  {record.subjectId ?? "sem subjectId"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span>{actorTypeLabels[record.actorType]}</span>
                <span className="text-muted-foreground text-xs">
                  {record.actorId ?? "sem actorId"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Collapsible asChild>
                <div>
                  <CollapsibleTrigger className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm font-medium outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    Ver detalhe
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="flex flex-col gap-3 rounded-lg border bg-muted/35 p-3">
                      <ContextRow label="Motivo" value={record.reason ?? "Sem motivo"} />
                      <ContextRow label="IP" value={record.ipAddress ?? "Não registado"} />
                      <ContextRow
                        label="Navegador"
                        value={record.userAgent ?? "Não registado"}
                      />
                      <JsonBlock label="Antes" value={record.before} />
                      <JsonBlock label="Depois" value={record.after} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
