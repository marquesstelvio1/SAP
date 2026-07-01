import { Card, CardContent, CardDescription, CardHeader, CardTitle, ContextRow } from "@saptm/ui";

export function TariffRulesCard() {
  return (
    <Card id="tariff-rules">
      <CardHeader>
        <CardTitle>Regras aplicadas</CardTitle>
        <CardDescription>
          Regras de negócio para rate cards, regras tarifárias e cotações.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <ContextRow label="Rate card" value="código único + moeda + validade temporal" />
        <ContextRow label="Regra" value="base tarifária válida + janela dentro do rate card" />
        <ContextRow
          label="Cotação"
          value="carga elegível + rate card ativo + regras aplicáveis + imposto válido"
        />
        <ContextRow label="Aprovação" value="estado calculado + evidência humana + referência" />
      </CardContent>
    </Card>
  );
}
