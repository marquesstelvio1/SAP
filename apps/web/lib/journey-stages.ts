import type { Route } from "next";

export type CargoJourneyState = {
  cargoId: string;
  cargoReference: string;
  status:
    | "registered"
    | "ready_for_transport"
    | "in_transport"
    | "held"
    | "delivered"
    | "cancelled";
  customsStatus: "not_required" | "pending" | "cleared" | "held";
  conditionStatus: "sound" | "damaged" | "requires_inspection";
  hazardous: boolean;
  requiresInspection: boolean;
  hasTrackingShipment: boolean;
  hasActiveReservation: boolean;
};

export type StageInfo = {
  module: "Cargo" | "Tracking" | "Planning" | "Capacity";
  stage: string;
  status: "complete" | "current" | "blocked" | "pending";
  actionLabel: string | null;
  actionHref: Route | null;
  blockedReason: string | null;
};

export function computeStages(cargo: CargoJourneyState, hasReservation: boolean): StageInfo[] {
  const stages: StageInfo[] = [];

  // Registration stage
  if (cargo.status === "cancelled") {
    stages.push({
      module: "Cargo",
      stage: "Registo",
      status: "blocked",
      actionLabel: "Carga cancelada",
      actionHref: null,
      blockedReason: "Carga foi cancelada. Nao e possivel avancar.",
    });
    return stages;
  }

  // Registration
  stages.push({
    module: "Cargo",
    stage: "Registo",
    status: "complete",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  // Compliance
  const needsCompliance =
    cargo.hazardous ||
    cargo.requiresInspection ||
    cargo.customsStatus === "pending" ||
    cargo.customsStatus === "held";
  const complianceComplete =
    cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required";
  stages.push({
    module: "Cargo",
    stage: "Compliance",
    status:
      cargo.status === "delivered"
        ? "complete"
        : !complianceComplete && needsCompliance
          ? "blocked"
          : cargo.status === "ready_for_transport" || cargo.status === "in_transport"
            ? "complete"
            : "current",
    actionLabel: complianceComplete ? null : "Resolver compliance",
    actionHref: complianceComplete ? null : ("/app/cargo#cargo-compliance-evidence" as Route),
    blockedReason:
      !complianceComplete && needsCompliance
        ? "Documentacao de compliance pendente ou retida."
        : null,
  });

  // Release
  const releaseBlocked =
    cargo.customsStatus === "held" ||
    cargo.requiresInspection ||
    (cargo.hazardous && cargo.conditionStatus !== "sound");
  stages.push({
    module: "Cargo",
    stage: "Liberacao",
    status:
      cargo.status === "delivered" || cargo.status === "in_transport"
        ? "complete"
        : cargo.status === "ready_for_transport"
          ? "complete"
          : releaseBlocked
            ? "blocked"
            : "current",
    actionLabel:
      cargo.status === "ready_for_transport" ||
      cargo.status === "in_transport" ||
      cargo.status === "delivered"
        ? null
        : "Liberar carga",
    actionHref:
      cargo.status === "ready_for_transport" ||
      cargo.status === "in_transport" ||
      cargo.status === "delivered"
        ? null
        : ("/app/cargo#cargo-release" as Route),
    blockedReason: releaseBlocked
      ? "Carga bloqueada: compliance pendente, inspecao requerida ou status aduaneiro retido."
      : null,
  });

  // Planning (Tracking)
  stages.push({
    module: "Tracking",
    stage: "Planeamento",
    status:
      cargo.status === "in_transport" || cargo.status === "delivered"
        ? "complete"
        : cargo.hasTrackingShipment
          ? "complete"
          : cargo.status === "ready_for_transport"
            ? "current"
            : "pending",
    actionLabel:
      cargo.hasTrackingShipment || cargo.status === "in_transport" || cargo.status === "delivered"
        ? null
        : "Criar tracking",
    actionHref:
      cargo.hasTrackingShipment || cargo.status === "in_transport" || cargo.status === "delivered"
        ? null
        : ("/app/cargo#cargo-transport-plan" as Route),
    blockedReason: null,
  });

  // Capacity Reservation
  stages.push({
    module: "Capacity",
    stage: "Reserva",
    status: hasReservation
      ? "complete"
      : cargo.status === "ready_for_transport" || cargo.status === "in_transport"
        ? "current"
        : "pending",
    actionLabel: hasReservation ? null : "Reservar slot",
    actionHref: hasReservation ? null : ("/app/capacity" as Route),
    blockedReason: null,
  });

  // Departure
  stages.push({
    module: "Tracking",
    stage: "Partida",
    status:
      cargo.status === "in_transport" || cargo.status === "delivered" ? "complete" : "pending",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  // Arrival
  stages.push({
    module: "Tracking",
    stage: "Chegada",
    status:
      cargo.status === "delivered"
        ? "complete"
        : cargo.status === "in_transport"
          ? "current"
          : "pending",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  // Delivery
  stages.push({
    module: "Cargo",
    stage: "Entrega",
    status: cargo.status === "delivered" ? "complete" : "pending",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  return stages;
}
