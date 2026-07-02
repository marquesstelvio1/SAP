"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  SelectNative,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import { createIdempotencyKey } from "@/lib/idempotency";
import type { TariffRateRuleAddFormState } from "../../app/(platform)/app/tariffs/form-state";

export type TariffRateRuleAddFormProps = {
  canManageTariffs: boolean;
  initialState: TariffRateRuleAddFormState;
  action: (
    previousState: TariffRateRuleAddFormState,
    formData: FormData,
  ) => Promise<TariffRateRuleAddFormState>;
};

export function TariffRateRuleAddForm({
  canManageTariffs,
  initialState,
  action,
}: TariffRateRuleAddFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("tariff_rule"));
  const isDisabled = isPending || !canManageTariffs;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("tariff_rule"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageTariffs ? "success" : "warning"}>
            {canManageTariffs ? "Regra controlada" : "Sem permissão"}
          </Badge>
          <Badge variant="outline">tariff.manage</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Adicionar regra tarifária</CardTitle>
          <CardDescription className="leading-6">
            Cria uma linha de cobrança por peso, volume, unidade, distância, flat ou percentagem.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="rateCardId">Rate card ID</FieldLabel>
                <Input disabled={isDisabled} id="rateCardId" name="rateCardId" required />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="ruleCode">Código da regra</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="ruleCode"
                  name="ruleCode"
                  placeholder="FREIGHT-KG"
                  required
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="chargeName">Nome da cobranca</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="chargeName"
                  name="chargeName"
                  placeholder="Frete por peso"
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="chargeType">Tipo</FieldLabel>
                <SelectNative disabled={isDisabled} id="chargeType" name="chargeType" required>
                  <option value="freight">Frete</option>
                  <option value="handling">Handling</option>
                  <option value="storage">Armazenagem</option>
                  <option value="demurrage">Demurrage</option>
                  <option value="surcharge">Surcharge</option>
                  <option value="discount">Desconto</option>
                  <option value="customs">Customs</option>
                  <option value="insurance">Seguro</option>
                  <option value="other">Outro</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="calculationBasis">Base</FieldLabel>
                <SelectNative
                  disabled={isDisabled}
                  id="calculationBasis"
                  name="calculationBasis"
                  required
                >
                  <option value="per_weight_kg">Por kg</option>
                  <option value="per_volume_m3">Por m3</option>
                  <option value="per_distance_km">Por km</option>
                  <option value="per_unit">Por unidade</option>
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentagem</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="cargoType">Tipo de carga opcional</FieldLabel>
                <SelectNative disabled={isDisabled} id="cargoType" name="cargoType">
                  <option value="">Qualquer</option>
                  <option value="container">Container</option>
                  <option value="bulk">Bulk</option>
                  <option value="break_bulk">Break bulk</option>
                  <option value="liquid_bulk">Liquid bulk</option>
                  <option value="refrigerated">Refrigerada</option>
                  <option value="hazardous">Hazardous</option>
                  <option value="vehicle">Veiculo</option>
                  <option value="other">Outro</option>
                </SelectNative>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="unitRate">Unit rate</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="unitRate"
                  min="0"
                  name="unitRate"
                  step="0.0001"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="flatAmount">Flat amount</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="flatAmount"
                  min="0"
                  name="flatAmount"
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="percentageRate">Percentagem</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="percentageRate"
                  min="0"
                  name="percentageRate"
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="minimumCharge">Mínimo</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="minimumCharge"
                  min="0"
                  name="minimumCharge"
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="originName">Origem opcional</FieldLabel>
                <Input disabled={isDisabled} id="originName" name="originName" />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="destinationName">Destino opcional</FieldLabel>
                <Input disabled={isDisabled} id="destinationName" name="destinationName" />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="effectiveFrom">Efetiva desde</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="effectiveFrom"
                  name="effectiveFrom"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="effectiveUntil">Efetiva ate</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="effectiveUntil"
                  name="effectiveUntil"
                  type="datetime-local"
                />
              </Field>
            </div>
            <Field data-disabled={!canManageTariffs}>
              <FieldLabel htmlFor="ruleSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="ruleSourceSystem"
                name="sourceSystem"
              />
            </Field>
            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Regra: ${state.ruleCode ?? state.ruleId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canManageTariffs ? "Bloqueia base tarifaria invalida." : "Requer gestao tarifaria."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A adicionar..." : "Adicionar regra"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
