"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@saptm/ui";

export type CommandEvidence = {
  auditAction: string;
  auditSubjectType: string;
  auditSubjectId: string;
  outboxEventType: string;
  outboxAggregateType: string;
  outboxAggregateId: string;
  idempotencyKey: string;
  idempotencyReplayed: boolean;
  businessRules: {
    allowed: boolean;
    appliedRules: string[];
    [key: string]: unknown;
  };
};

export type CommandEvidencePanelProps = {
  evidence: CommandEvidence;
  title?: string;
};

export function CommandEvidencePanel({ evidence, title }: CommandEvidencePanelProps) {
  return (
    <Card className="border-success/30 bg-success/5">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">
            {evidence.idempotencyReplayed ? "Resposta idempotente" : "Comando executado"}
          </Badge>
          <Badge variant="outline">Evidencia pos-comando</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{title ?? "Comando processado com sucesso"}</CardTitle>
          <CardDescription className="text-xs leading-5">
            {evidence.idempotencyReplayed
              ? "O comando ja tinha sido processado anteriormente. A resposta idempotente foi reaproveitada sem efeitos colaterais."
              : "O comando foi aceite com auditoria e regras de negocio aplicadas."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
            Registo de auditoria
          </span>
          <div className="grid gap-2 rounded-lg border bg-card/50 p-3 text-xs md:grid-cols-2">
            <EvidenceRow label="Acao" value={evidence.auditAction} />
            <EvidenceRow label="Tipo de sujeito" value={evidence.auditSubjectType} />
            <EvidenceRow label="ID do sujeito" value={evidence.auditSubjectId} />
            <EvidenceRow label="Chave de idempotencia" value={evidence.idempotencyKey} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
            Evento de integração
          </span>
          <div className="grid gap-2 rounded-lg border bg-card/50 p-3 text-xs md:grid-cols-3">
            <EvidenceRow label="Tipo de evento" value={evidence.outboxEventType} />
            <EvidenceRow label="Agregado" value={evidence.outboxAggregateType} />
            <EvidenceRow label="ID do agregado" value={evidence.outboxAggregateId} />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
            Regras de negocio aplicadas ({evidence.businessRules.appliedRules.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {evidence.businessRules.appliedRules.length === 0 ? (
              <span className="text-muted-foreground text-xs">
                Nenhuma regra especifica registada.
              </span>
            ) : (
              evidence.businessRules.appliedRules.map((rule, index) => (
                <Badge key={index} variant="outline" className="text-2xs">
                  {rule}
                </Badge>
              ))
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs">
            {Object.entries(evidence.businessRules)
              .filter(([key]) => key !== "appliedRules")
              .map(([key, value]) => (
                <span className="flex items-center gap-1.5" key={key}>
                  <span className="text-muted-foreground">{key}:</span>
                  <Badge
                    variant={value === true ? "success" : value === false ? "warning" : "outline"}
                    className="text-[0.6rem]"
                  >
                    {String(value)}
                  </Badge>
                </span>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}
