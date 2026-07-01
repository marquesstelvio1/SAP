import { Card, CardContent, CardDescription, CardHeader, CardTitle, ContextRow } from "@saptm/ui";

export function CapacityRulesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras aplicadas</CardTitle>
        <CardDescription>Regras de negócio aplicadas a recursos, slots e reservas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm md:grid-cols-2">
        <ContextRow label="Recurso" value="código único + limite positivo + idempotência" />
        <ContextRow label="Slot" value="janela válida + limite por recurso + referência única" />
        <ContextRow label="Reserva" value="cargo elegível + slot aberto + capacidade disponível" />
        <ContextRow
          label="Cancelamento"
          value="reserva ativa + data válida + release de unidades"
        />
        <ContextRow label="Advisory" value="consultivo + decisão humana + sem automação direta" />
      </CardContent>
    </Card>
  );
}
