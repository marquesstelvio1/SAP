"use client";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";

type SlotInfo = {
  id: string;
  slotReference: string;
  resourceCode: string;
  resourceType: string;
  locationName: string;
  windowStartAt: string;
  windowEndAt: string;
  capacityUnits: number;
  availableUnits: number;
  status: "open" | "blocked" | "closed";
};

type CargoEligibilityInfo = {
  cargoId: string;
  cargoReference: string;
  status: string;
  eligible: boolean;
  ineligibilityReason: string | null;
};

export type CapacityPreCheckProps = {
  slots: readonly SlotInfo[];
  onSelectSlot?: (slotId: string) => void;
  selectedSlotId?: string | null;
  cargoEligibility?: CargoEligibilityInfo | null;
};

const resourceTypeLabels: Record<string, string> = {
  terminal: "Terminal",
  gate: "Gate",
  berth: "Berth / cais",
  rail_track: "Linha ferroviaria",
  yard: "Patio",
  carrier_slot: "Slot transportador",
};

export function CapacityPreCheck({
  slots,
  onSelectSlot: externalOnSelectSlot,
  selectedSlotId: externalSelectedSlotId,
  cargoEligibility,
}: CapacityPreCheckProps) {
  const [internalSelectedSlotId, setInternalSelectedSlotId] = useState<string | null>(null);
  const selectedSlotId = externalSelectedSlotId ?? internalSelectedSlotId;
  const onSelectSlot = externalOnSelectSlot ?? setInternalSelectedSlotId;
  const hasOverbookingRisk = useMemo(() => {
    return slots.some(
      (slot) =>
        slot.status === "open" && slot.availableUnits <= Math.ceil(slot.capacityUnits * 0.15),
    );
  }, [slots]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Pre-check P1</Badge>
          <Badge variant="outline">Verificacao ante reserva</Badge>
          {hasOverbookingRisk ? <Badge variant="warning">Risco de overbooking</Badge> : null}
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg">Verificacao de disponibilidade</CardTitle>
          <CardDescription className="text-sm leading-6">
            Antes de reservar, confira as unidades disponiveis por slot e a elegibilidade da carga.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Cargo eligibility */}
        {cargoEligibility !== null && cargoEligibility !== undefined ? (
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
                Carga
              </span>
              <Badge
                variant={cargoEligibility.eligible ? "success" : "warning"}
                className="text-[0.6rem]"
              >
                {cargoEligibility.eligible ? "Elegivel" : "Inelegivel"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <span className="font-medium text-sm">{cargoEligibility.cargoReference}</span>
              <span className="text-muted-foreground text-xs">
                Estado: {cargoEligibility.status}
              </span>
              {cargoEligibility.ineligibilityReason !== null ? (
                <span className="text-warning text-xs">{cargoEligibility.ineligibilityReason}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
            Selecione ou informe um ID de carga para verificar elegibilidade.
          </div>
        )}

        {/* Available slots */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
            Slots disponiveis ({slots.length})
          </span>
          {slots.length === 0 ? (
            <div className="rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
              Nenhum slot aberto disponivel.
            </div>
          ) : (
            <div className="grid gap-2">
              {slots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const utilizationPercent =
                  ((slot.capacityUnits - slot.availableUnits) / slot.capacityUnits) * 100;
                const isLowAvailability =
                  slot.availableUnits <= Math.ceil(slot.capacityUnits * 0.15);

                return (
                  <button
                    className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : slot.status === "open"
                          ? "hover:bg-muted/30"
                          : "opacity-50"
                    }`}
                    disabled={slot.status !== "open"}
                    key={slot.id}
                    onClick={() => onSelectSlot(slot.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{slot.slotReference}</span>
                        <Badge variant="outline" className="text-[0.55rem]">
                          {resourceTypeLabels[slot.resourceType] ?? slot.resourceType}
                        </Badge>
                      </div>
                      <Badge
                        variant={
                          slot.status === "open"
                            ? "success"
                            : slot.status === "blocked"
                              ? "warning"
                              : "outline"
                        }
                        className="text-[0.55rem]"
                      >
                        {slot.status === "open"
                          ? "Aberto"
                          : slot.status === "blocked"
                            ? "Bloqueado"
                            : "Fechado"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {slot.resourceCode} · {slot.locationName}
                      </span>
                      <span>
                        {slot.windowStartAt} → {slot.windowEndAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLowAvailability ? "bg-warning" : "bg-success"
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isLowAvailability ? "text-warning" : "text-success"
                          }`}
                        >
                          {slot.availableUnits}/{slot.capacityUnits}
                        </span>
                      </div>
                      {isLowAvailability && slot.status === "open" ? (
                        <Badge variant="warning" className="text-[0.5rem]">
                          Poucas unidades
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Overbooking warning */}
        {hasOverbookingRisk ? (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <span className="mt-0.5 shrink-0 text-warning">!</span>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-warning text-xs">Alerta de overbooking</span>
              <span className="text-muted-foreground text-xs">
                Um ou mais slots tem 15% ou menos de unidades disponiveis. A reserva pode ser
                bloqueada pelo backend se a capacidade for insuficiente.
              </span>
            </div>
          </div>
        ) : null}

        {/* Module links */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-2xs text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
            href={"/app/capacity" as Route}
          >
            Ver todos os slots
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-2xs text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
            href={"/app/audit?subjectType=capacity&limit=25" as Route}
          >
            Auditoria de capacidade
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
