import type {
  CargoClaimSettlementRecordInput,
  CargoClaimSettlementRecordOutput,
  CargoComplianceEvidenceRecordInput,
  CargoComplianceEvidenceRecordOutput,
  CargoComplianceEvidenceVerifyInput,
  CargoComplianceEvidenceVerifyOutput,
  CargoDeliveryCompleteInput,
  CargoDeliveryCompleteOutput,
  CargoDeliveryExceptionRecordInput,
  CargoDeliveryExceptionRecordOutput,
  CargoDeliveryExceptionResolveInput,
  CargoDeliveryExceptionResolveOutput,
  CargoOperationalHandoffRecordInput,
  CargoOperationalHandoffRecordOutput,
  CargoRegisterInput,
  CargoRegisterOutput,
  CargoReleaseInput,
  CargoReleaseOutput,
  CargoTransportArriveInput,
  CargoTransportArriveOutput,
  CargoTransportDepartInput,
  CargoTransportDepartOutput,
  CargoTransportPlanInput,
  CargoTransportPlanOutput,
} from "@saptm/rpc";
import type {
  CargoClaimSettlementRecord,
  CargoComplianceEvidenceRecord,
  CargoComplianceEvidenceStatusCounts,
  CargoComplianceEvidenceWithCargo,
  CargoDeliveryExceptionRecord,
  CargoDeliveryExceptionWithCargo,
  CargoOperationalHandoffRecord,
  CargoRecord,
  TrackingShipmentRecord,
} from "./dto.js";

export function resolveCargoBusinessRules(
  input: CargoRegisterInput,
): CargoRegisterOutput["businessRules"] {
  const customsBlocked = input.customsStatus === "held";
  const inspectionRequired =
    input.requiresInspection ||
    input.hazardous ||
    input.conditionStatus === "damaged" ||
    input.conditionStatus === "requires_inspection";
  const movementBlocked = customsBlocked || inspectionRequired;
  const appliedRules = [
    "tenant_scoped_cargo_identity",
    "unique_cargo_reference",
    "idempotent_registration",
    "positive_weight_and_package_count",
    "custody_origin_destination_required",
  ];

  if (input.hazardous) {
    appliedRules.push("hazardous_cargo_requires_un_number_and_hazard_class");
  }

  if (customsBlocked) {
    appliedRules.push("customs_hold_requires_reference");
  }

  if (input.conditionStatus === "damaged") {
    appliedRules.push("damaged_cargo_requires_inspection");
  }

  if (inspectionRequired) {
    appliedRules.push("inspection_required_before_unrestricted_movement");
  }

  if (movementBlocked) {
    appliedRules.push("movement_blocked_until_governed_release");
  }

  return {
    movementBlocked,
    inspectionRequired,
    customsBlocked,
    appliedRules,
  };
}

export function resolveCargoReleaseBusinessRules(
  cargo: CargoRecord,
  input: CargoReleaseInput,
): CargoReleaseOutput["businessRules"] {
  const releasableStatus = cargo.status === "registered" || cargo.status === "held";
  const customsReleaseRequired = cargo.customsStatus !== "not_required";
  const customsReleased =
    input.customsStatus === "cleared" ||
    (!customsReleaseRequired && input.customsStatus === "not_required");
  const inspectionRequiredBeforeRelease =
    cargo.requiresInspection ||
    cargo.conditionStatus === "damaged" ||
    cargo.conditionStatus === "requires_inspection";
  const inspectionPassed = !inspectionRequiredBeforeRelease || input.inspectionOutcome === "passed";
  const hazardousComplianceComplete =
    !cargo.hazardous || (cargo.unNumber !== null && cargo.hazardClass !== null);
  const releaseAllowed =
    releasableStatus && customsReleased && inspectionPassed && hazardousComplianceComplete;
  const appliedRules = [
    "tenant_scoped_cargo_release",
    "idempotent_release",
    "release_requires_registered_or_held_status",
    "release_requires_customs_clearance_when_applicable",
    "release_requires_inspection_pass_when_applicable",
    "hazardous_cargo_release_requires_un_number_and_hazard_class",
    "release_creates_audit_and_outbox",
  ];

  if (!releasableStatus) {
    appliedRules.push("release_blocked_for_non_releasable_status");
  }

  if (customsReleaseRequired) {
    appliedRules.push("customs_release_required_before_transport");
  }

  if (!customsReleased) {
    appliedRules.push("release_blocked_until_customs_cleared");
  }

  if (inspectionRequiredBeforeRelease) {
    appliedRules.push("inspection_required_before_release");
  }

  if (!inspectionPassed) {
    appliedRules.push("release_blocked_until_inspection_passed");
  }

  if (!hazardousComplianceComplete) {
    appliedRules.push("release_blocked_until_hazardous_compliance_complete");
  }

  if (releaseAllowed) {
    appliedRules.push("cargo_ready_for_transport_after_governed_release");
  }

  return {
    releaseAllowed,
    movementBlocked: !releaseAllowed,
    customsReleaseRequired,
    inspectionRequiredBeforeRelease,
    appliedRules,
  };
}

export function createReleasedCargoBusinessRules(
  cargo: CargoRecord,
): CargoReleaseOutput["businessRules"] {
  return {
    releaseAllowed: cargo.status === "ready_for_transport",
    movementBlocked: cargo.status !== "ready_for_transport",
    customsReleaseRequired: false,
    inspectionRequiredBeforeRelease: false,
    appliedRules: [
      "tenant_scoped_cargo_release",
      "idempotent_release_replay",
      "cargo_ready_for_transport_after_governed_release",
    ],
  };
}

export function resolveCargoTransportPlanBusinessRules(
  cargo: CargoRecord,
  input: CargoTransportPlanInput,
): CargoTransportPlanOutput["businessRules"] {
  const plannedDepartureAt = new Date(input.plannedDepartureAt);
  const estimatedArrivalAt = new Date(input.estimatedArrivalAt);
  const releasedAt = cargo.releasedAt;
  const cargoReadyForTracking =
    cargo.status === "ready_for_transport" &&
    cargo.releaseIdempotencyKey !== null &&
    releasedAt !== null &&
    !cargo.requiresInspection &&
    (cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required");
  const trackingNotLinked = cargo.trackingShipmentId === null;
  const departureAfterRelease = releasedAt === null || plannedDepartureAt >= releasedAt;
  const arrivalAfterDeparture = estimatedArrivalAt > plannedDepartureAt;
  const planningAllowed =
    cargoReadyForTracking && trackingNotLinked && departureAfterRelease && arrivalAfterDeparture;
  const appliedRules = [
    "tenant_scoped_cargo_tracking_linkage",
    "idempotent_transport_planning",
    "transport_planning_requires_released_cargo",
    "transport_planning_requires_no_open_inspection",
    "transport_planning_requires_customs_clearance",
    "transport_planning_requires_unique_tracking_reference",
    "transport_planning_creates_tracking_shipment",
    "transport_planning_creates_initial_tracking_event",
    "transport_planning_creates_audit_and_outbox",
  ];

  if (!cargoReadyForTracking) {
    appliedRules.push("transport_planning_blocked_until_cargo_ready");
  }

  if (!trackingNotLinked) {
    appliedRules.push("transport_planning_blocked_when_tracking_already_linked");
  }

  if (!departureAfterRelease) {
    appliedRules.push("transport_departure_cannot_precede_cargo_release");
  }

  if (!arrivalAfterDeparture) {
    appliedRules.push("transport_arrival_must_follow_departure");
  }

  if (input.transportMode === "multimodal") {
    appliedRules.push("multimodal_transport_requires_high_severity_audit");
  }

  if (planningAllowed) {
    appliedRules.push("cargo_linked_to_tracking_shipment");
  }

  return {
    planningAllowed,
    cargoReadyForTracking,
    trackingLinked: !trackingNotLinked || planningAllowed,
    appliedRules,
  };
}

export function createPlannedCargoBusinessRules(
  cargo: CargoRecord,
): CargoTransportPlanOutput["businessRules"] {
  return {
    planningAllowed: cargo.trackingShipmentId !== null,
    cargoReadyForTracking: cargo.status === "ready_for_transport",
    trackingLinked: cargo.trackingShipmentId !== null,
    appliedRules: [
      "tenant_scoped_cargo_tracking_linkage",
      "idempotent_transport_planning_replay",
      "cargo_linked_to_tracking_shipment",
    ],
  };
}

export function resolveCargoTransportDepartBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  complianceEvidenceCounts: CargoComplianceEvidenceStatusCounts,
  input: CargoTransportDepartInput,
): CargoTransportDepartOutput["businessRules"] {
  const departedAt = new Date(input.departedAt);
  const cargoReadyForDeparture =
    cargo.status === "ready_for_transport" &&
    cargo.releaseIdempotencyKey !== null &&
    cargo.releasedAt !== null &&
    cargo.transportPlanIdempotencyKey !== null &&
    cargo.trackingShipmentId !== null &&
    cargo.requiresInspection === false &&
    (cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required");
  const trackingShipmentPlanned = shipment.status === "planned";
  const approvedComplianceEvidencePresent = complianceEvidenceCounts.approved > 0;
  const openComplianceReviewBlocked =
    complianceEvidenceCounts.pendingReview > 0 || complianceEvidenceCounts.rejected > 0;
  const departureAfterRelease = cargo.releasedAt === null || departedAt >= cargo.releasedAt;
  const departureAfterPlanning =
    cargo.transportPlannedAt === null || departedAt >= cargo.transportPlannedAt;
  const departureAllowed =
    cargoReadyForDeparture &&
    trackingShipmentPlanned &&
    approvedComplianceEvidencePresent &&
    !openComplianceReviewBlocked &&
    departureAfterRelease &&
    departureAfterPlanning;
  const appliedRules = [
    "tenant_scoped_cargo_departure",
    "idempotent_cargo_departure",
    "departure_requires_ready_cargo",
    "departure_requires_governed_release",
    "departure_requires_tracking_plan",
    "departure_requires_planned_tracking_shipment",
    "departure_requires_approved_compliance_evidence",
    "departure_blocks_pending_or_rejected_compliance_evidence",
    "departure_creates_tracking_departed_event",
    "departure_updates_cargo_and_tracking_transactionally",
    "departure_creates_audit_and_outbox",
  ];

  if (!cargoReadyForDeparture) {
    appliedRules.push("departure_blocked_until_cargo_ready_for_transport");
  }

  if (!trackingShipmentPlanned) {
    appliedRules.push("departure_blocked_when_tracking_not_planned");
  }

  if (!approvedComplianceEvidencePresent) {
    appliedRules.push("departure_blocked_without_approved_compliance_evidence");
  }

  if (openComplianceReviewBlocked) {
    appliedRules.push("departure_blocked_by_open_compliance_review");
  }

  if (!departureAfterRelease) {
    appliedRules.push("departure_cannot_precede_cargo_release");
  }

  if (!departureAfterPlanning) {
    appliedRules.push("departure_cannot_precede_transport_planning");
  }

  if (departureAllowed) {
    appliedRules.push("cargo_departed_to_in_transport");
    appliedRules.push("tracking_shipment_moved_to_in_transit");
  }

  return {
    departureAllowed,
    cargoReadyForDeparture,
    trackingShipmentPlanned,
    approvedComplianceEvidencePresent,
    openComplianceReviewBlocked,
    appliedRules,
  };
}

export function createDepartedCargoBusinessRules(
  cargo: CargoRecord,
): CargoTransportDepartOutput["businessRules"] {
  return {
    departureAllowed: cargo.departureIdempotencyKey !== null,
    cargoReadyForDeparture: cargo.status === "in_transport",
    trackingShipmentPlanned: true,
    approvedComplianceEvidencePresent: true,
    openComplianceReviewBlocked: false,
    appliedRules: [
      "tenant_scoped_cargo_departure",
      "idempotent_cargo_departure_replay",
      "cargo_departed_to_in_transport",
      "tracking_shipment_moved_to_in_transit",
    ],
  };
}

export function resolveCargoTransportArriveBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  input: CargoTransportArriveInput,
): CargoTransportArriveOutput["businessRules"] {
  const arrivedAt = new Date(input.arrivedAt);
  const cargoInTransport =
    cargo.status === "in_transport" &&
    cargo.departureIdempotencyKey !== null &&
    cargo.departedAt !== null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentInTransit = shipment.status === "in_transit";
  const arrivalAfterDeparture = cargo.departedAt === null || arrivedAt >= cargo.departedAt;
  const arrivalAllowed = cargoInTransport && trackingShipmentInTransit && arrivalAfterDeparture;
  const appliedRules = [
    "tenant_scoped_cargo_arrival",
    "idempotent_cargo_arrival",
    "arrival_requires_departed_cargo",
    "arrival_requires_in_transit_tracking_shipment",
    "arrival_cannot_precede_departure",
    "arrival_creates_tracking_arrived_event",
    "arrival_updates_tracking_actual_arrival",
    "arrival_creates_audit_and_outbox",
  ];

  if (!cargoInTransport) {
    appliedRules.push("arrival_blocked_until_cargo_in_transport");
  }

  if (!trackingShipmentInTransit) {
    appliedRules.push("arrival_blocked_when_tracking_not_in_transit");
  }

  if (!arrivalAfterDeparture) {
    appliedRules.push("arrival_cannot_precede_departure_timestamp");
  }

  if (arrivalAllowed) {
    appliedRules.push("tracking_shipment_moved_to_arrived");
  }

  return {
    arrivalAllowed,
    cargoInTransport,
    trackingShipmentInTransit,
    arrivalAfterDeparture,
    appliedRules,
  };
}

export function createArrivedCargoBusinessRules(
  cargo: CargoRecord,
): CargoTransportArriveOutput["businessRules"] {
  return {
    arrivalAllowed: cargo.arrivalIdempotencyKey !== null,
    cargoInTransport: cargo.status === "in_transport",
    trackingShipmentInTransit: true,
    arrivalAfterDeparture: true,
    appliedRules: [
      "tenant_scoped_cargo_arrival",
      "idempotent_cargo_arrival_replay",
      "tracking_shipment_moved_to_arrived",
    ],
  };
}

export function resolveCargoOperationalHandoffBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  duplicateReference: CargoOperationalHandoffRecord | null,
  input: CargoOperationalHandoffRecordInput,
): CargoOperationalHandoffRecordOutput["businessRules"] {
  const handoffAt = new Date(input.handoffAt);
  const currentCustodyOwner = input.fromCustodyOwnerName.trim().toLocaleLowerCase();
  const fromCustodyOwner = input.fromCustodyOwnerName.trim().toLocaleLowerCase();
  const toCustodyOwner = input.toCustodyOwnerName.trim().toLocaleLowerCase();
  const cargoInTransport =
    cargo.status === "in_transport" &&
    cargo.departureIdempotencyKey !== null &&
    cargo.departedAt !== null &&
    cargo.arrivalIdempotencyKey === null &&
    cargo.arrivedAt === null &&
    cargo.deliveredAt === null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentInTransit = shipment.status === "in_transit";
  const handoffAfterDeparture = cargo.departedAt === null || handoffAt >= cargo.departedAt;
  const handoffBeforeArrival = cargo.arrivedAt === null || handoffAt <= cargo.arrivedAt;
  const currentCustodyMatched = currentCustodyOwner === fromCustodyOwner;
  const custodyChanged = fromCustodyOwner !== toCustodyOwner;
  const conditionAccepted = input.conditionStatus === "sound";
  const duplicateReferenceBlocked = duplicateReference !== null;
  const handoffAllowed =
    cargoInTransport &&
    trackingShipmentInTransit &&
    handoffAfterDeparture &&
    handoffBeforeArrival &&
    currentCustodyMatched &&
    custodyChanged &&
    conditionAccepted &&
    !duplicateReferenceBlocked;
  const appliedRules = [
    "tenant_scoped_operational_handoff",
    "idempotent_operational_handoff_record",
    "handoff_requires_in_transit_cargo",
    "handoff_requires_in_transit_tracking_shipment",
    "handoff_cannot_precede_departure",
    "handoff_cannot_follow_arrival",
    "handoff_requires_current_custody_match",
    "handoff_requires_custody_change",
    "handoff_requires_sound_condition",
    "handoff_blocks_duplicate_reference",
    "handoff_creates_tracking_location_update_event",
    "handoff_updates_custody_owner_transactionally",
    "handoff_creates_audit_and_outbox",
  ];

  if (!cargoInTransport) {
    appliedRules.push("handoff_blocked_until_cargo_in_transport");
  }

  if (!trackingShipmentInTransit) {
    appliedRules.push("handoff_blocked_when_tracking_not_in_transit");
  }

  if (!handoffAfterDeparture) {
    appliedRules.push("handoff_cannot_precede_departure_timestamp");
  }

  if (!handoffBeforeArrival) {
    appliedRules.push("handoff_cannot_follow_arrival_timestamp");
  }

  if (!currentCustodyMatched) {
    appliedRules.push("handoff_blocked_when_from_custody_mismatches_current_owner");
  }

  if (!custodyChanged) {
    appliedRules.push("handoff_blocked_without_custody_change");
  }

  if (!conditionAccepted) {
    appliedRules.push("handoff_blocked_until_exception_workflow");
  }

  if (duplicateReferenceBlocked) {
    appliedRules.push("handoff_blocked_by_duplicate_reference");
  }

  if (handoffAllowed) {
    appliedRules.push("cargo_custody_transferred");
    appliedRules.push("tracking_location_updated_for_handoff");
  }

  return {
    handoffAllowed,
    cargoInTransport,
    trackingShipmentInTransit,
    handoffAfterDeparture,
    handoffBeforeArrival,
    currentCustodyMatched,
    custodyChanged,
    conditionAccepted,
    duplicateReferenceBlocked,
    appliedRules,
  };
}

export function createRecordedOperationalHandoffBusinessRules(
  handoff: CargoOperationalHandoffRecord,
): CargoOperationalHandoffRecordOutput["businessRules"] {
  return {
    handoffAllowed: handoff.recordIdempotencyKey !== null,
    cargoInTransport: true,
    trackingShipmentInTransit: true,
    handoffAfterDeparture: true,
    handoffBeforeArrival: true,
    currentCustodyMatched: true,
    custodyChanged: true,
    conditionAccepted: handoff.conditionStatus === "sound",
    duplicateReferenceBlocked: false,
    appliedRules: [
      "tenant_scoped_operational_handoff",
      "idempotent_operational_handoff_record_replay",
      "cargo_custody_transferred",
      "tracking_location_updated_for_handoff",
    ],
  };
}

export function resolveCargoDeliveryCompleteBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  input: CargoDeliveryCompleteInput,
): CargoDeliveryCompleteOutput["businessRules"] {
  const deliveredAt = new Date(input.deliveredAt);
  const cargoArrivedForDelivery =
    cargo.status === "in_transport" &&
    cargo.arrivalIdempotencyKey !== null &&
    cargo.arrivedAt !== null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentArrived = shipment.status === "arrived";
  const deliveryAfterArrival = cargo.arrivedAt === null || deliveredAt >= cargo.arrivedAt;
  const deliveryConditionAccepted = input.deliveryConditionStatus === "sound";
  const deliveryAllowed =
    cargoArrivedForDelivery &&
    trackingShipmentArrived &&
    deliveryAfterArrival &&
    deliveryConditionAccepted;
  const appliedRules = [
    "tenant_scoped_cargo_delivery",
    "idempotent_cargo_delivery",
    "delivery_requires_arrived_cargo",
    "delivery_requires_arrived_tracking_shipment",
    "delivery_cannot_precede_arrival",
    "delivery_requires_sound_condition",
    "delivery_creates_handover_completed_event",
    "delivery_updates_cargo_and_tracking_transactionally",
    "delivery_creates_audit_and_outbox",
  ];

  if (!cargoArrivedForDelivery) {
    appliedRules.push("delivery_blocked_until_cargo_arrived");
  }

  if (!trackingShipmentArrived) {
    appliedRules.push("delivery_blocked_when_tracking_not_arrived");
  }

  if (!deliveryAfterArrival) {
    appliedRules.push("delivery_cannot_precede_arrival_timestamp");
  }

  if (!deliveryConditionAccepted) {
    appliedRules.push("delivery_blocked_until_exception_or_inspection_resolution");
  }

  if (deliveryAllowed) {
    appliedRules.push("cargo_marked_delivered");
    appliedRules.push("tracking_shipment_moved_to_completed");
  }

  return {
    deliveryAllowed,
    cargoArrivedForDelivery,
    trackingShipmentArrived,
    deliveryAfterArrival,
    deliveryConditionAccepted,
    appliedRules,
  };
}

export function createDeliveredCargoBusinessRules(
  cargo: CargoRecord,
): CargoDeliveryCompleteOutput["businessRules"] {
  return {
    deliveryAllowed: cargo.deliveryIdempotencyKey !== null,
    cargoArrivedForDelivery: cargo.arrivedAt !== null,
    trackingShipmentArrived: true,
    deliveryAfterArrival: true,
    deliveryConditionAccepted: cargo.conditionStatus === "sound",
    appliedRules: [
      "tenant_scoped_cargo_delivery",
      "idempotent_cargo_delivery_replay",
      "cargo_marked_delivered",
      "tracking_shipment_moved_to_completed",
    ],
  };
}

export function resolveCargoDeliveryExceptionRecordBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  openException: CargoDeliveryExceptionRecord | null,
  input: CargoDeliveryExceptionRecordInput,
): CargoDeliveryExceptionRecordOutput["businessRules"] {
  const occurredAt = new Date(input.occurredAt);
  const cargoArrivedForException =
    cargo.status === "in_transport" &&
    cargo.arrivalIdempotencyKey !== null &&
    cargo.arrivedAt !== null &&
    cargo.deliveryIdempotencyKey === null &&
    cargo.deliveredAt === null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentArrived = shipment.status === "arrived";
  const openExceptionBlocked = openException !== null;
  const exceptionAfterArrival = cargo.arrivedAt === null || occurredAt >= cargo.arrivedAt;
  const exceptionAccepted =
    cargoArrivedForException &&
    trackingShipmentArrived &&
    !openExceptionBlocked &&
    exceptionAfterArrival;
  const appliedRules = [
    "tenant_scoped_delivery_exception",
    "idempotent_delivery_exception_record",
    "delivery_exception_requires_arrived_cargo",
    "delivery_exception_requires_arrived_tracking_shipment",
    "delivery_exception_blocks_duplicate_open_exception",
    "delivery_exception_cannot_precede_arrival",
    "delivery_exception_creates_tracking_exception_event",
    "delivery_exception_moves_cargo_to_held",
    "delivery_exception_creates_audit_and_outbox",
  ];

  if (!cargoArrivedForException) {
    appliedRules.push("delivery_exception_blocked_until_cargo_arrived");
  }

  if (!trackingShipmentArrived) {
    appliedRules.push("delivery_exception_blocked_when_tracking_not_arrived");
  }

  if (openExceptionBlocked) {
    appliedRules.push("delivery_exception_blocked_by_existing_open_exception");
  }

  if (!exceptionAfterArrival) {
    appliedRules.push("delivery_exception_cannot_precede_arrival_timestamp");
  }

  if (exceptionAccepted) {
    appliedRules.push("cargo_delivery_exception_opened");
    appliedRules.push("tracking_shipment_moved_to_exception");
  }

  return {
    exceptionAccepted,
    cargoArrivedForException,
    trackingShipmentArrived,
    openExceptionBlocked,
    exceptionAfterArrival,
    appliedRules,
  };
}

export function createRecordedDeliveryExceptionBusinessRules(
  exception: CargoDeliveryExceptionRecord,
): CargoDeliveryExceptionRecordOutput["businessRules"] {
  return {
    exceptionAccepted: exception.recordIdempotencyKey !== null,
    cargoArrivedForException: true,
    trackingShipmentArrived: true,
    openExceptionBlocked: false,
    exceptionAfterArrival: true,
    appliedRules: [
      "tenant_scoped_delivery_exception",
      "idempotent_delivery_exception_record_replay",
      "cargo_delivery_exception_opened",
      "tracking_shipment_moved_to_exception",
    ],
  };
}

export function resolveCargoDeliveryExceptionResolveBusinessRules(
  exception: CargoDeliveryExceptionWithCargo,
  shipment: TrackingShipmentRecord,
  input: CargoDeliveryExceptionResolveInput,
): CargoDeliveryExceptionResolveOutput["businessRules"] {
  const resolvedAt = new Date(input.resolvedAt);
  const openException = exception.status === "open";
  const cargoHeldForInspection =
    exception.cargo.status === "held" &&
    exception.cargo.requiresInspection &&
    exception.cargo.deliveredAt === null;
  const trackingShipmentException = shipment.status === "exception";
  const resolutionAfterException = resolvedAt >= exception.occurredAt;
  const cargoRestoredForDelivery = input.finalConditionStatus === "sound";
  const resolutionAllowed =
    openException &&
    cargoHeldForInspection &&
    trackingShipmentException &&
    resolutionAfterException &&
    cargoRestoredForDelivery;
  const appliedRules = [
    "tenant_scoped_delivery_exception_resolution",
    "idempotent_delivery_exception_resolution",
    "delivery_exception_resolution_requires_open_exception",
    "delivery_exception_resolution_requires_held_cargo",
    "delivery_exception_resolution_requires_tracking_exception",
    "delivery_exception_resolution_cannot_precede_exception",
    "delivery_exception_resolution_restores_sound_condition",
    "delivery_exception_resolution_reopens_delivery_completion",
    "delivery_exception_resolution_creates_audit_and_outbox",
  ];

  if (!openException) {
    appliedRules.push("delivery_exception_resolution_blocked_when_not_open");
  }

  if (!cargoHeldForInspection) {
    appliedRules.push("delivery_exception_resolution_blocked_when_cargo_not_held");
  }

  if (!trackingShipmentException) {
    appliedRules.push("delivery_exception_resolution_blocked_when_tracking_not_exception");
  }

  if (!resolutionAfterException) {
    appliedRules.push("delivery_exception_resolution_cannot_precede_exception_timestamp");
  }

  if (!cargoRestoredForDelivery) {
    appliedRules.push("delivery_exception_resolution_requires_sound_final_condition");
  }

  if (resolutionAllowed) {
    appliedRules.push("cargo_restored_for_delivery_completion");
    appliedRules.push("tracking_shipment_restored_to_arrived");
  }

  return {
    resolutionAllowed,
    openException,
    cargoHeldForInspection,
    trackingShipmentException,
    resolutionAfterException,
    cargoRestoredForDelivery,
    appliedRules,
  };
}

export function createResolvedDeliveryExceptionBusinessRules(
  exception: CargoDeliveryExceptionRecord,
): CargoDeliveryExceptionResolveOutput["businessRules"] {
  return {
    resolutionAllowed: exception.resolveIdempotencyKey !== null,
    openException: false,
    cargoHeldForInspection: false,
    trackingShipmentException: false,
    resolutionAfterException: true,
    cargoRestoredForDelivery: true,
    appliedRules: [
      "tenant_scoped_delivery_exception_resolution",
      "idempotent_delivery_exception_resolution_replay",
      "cargo_restored_for_delivery_completion",
      "tracking_shipment_restored_to_arrived",
    ],
  };
}

export function resolveCargoClaimSettlementRecordBusinessRules(
  exception: CargoDeliveryExceptionWithCargo,
  duplicateSettlement: CargoClaimSettlementRecord | null,
  duplicateReference: CargoClaimSettlementRecord | null,
  input: CargoClaimSettlementRecordInput,
): CargoClaimSettlementRecordOutput["businessRules"] {
  const settledAt = new Date(input.settledAt);
  const resolvedException = exception.status === "resolved" && exception.resolvedAt !== null;
  const claimReferencePresent = exception.claimReference !== null;
  const claimReferenceMatched =
    claimReferencePresent &&
    (exception.claimReference ?? "").trim().toLocaleLowerCase() ===
      input.claimReference.trim().toLocaleLowerCase();
  const claimResolutionAccepted = exception.resolutionCode === "claim_accepted";
  const settlementAfterResolution =
    exception.resolvedAt === null || settledAt >= exception.resolvedAt;
  const duplicateSettlementBlocked = duplicateSettlement !== null;
  const duplicateReferenceBlocked = duplicateReference !== null;
  const settlementAllowed =
    resolvedException &&
    claimReferencePresent &&
    claimReferenceMatched &&
    claimResolutionAccepted &&
    settlementAfterResolution &&
    !duplicateSettlementBlocked &&
    !duplicateReferenceBlocked;
  const appliedRules = [
    "tenant_scoped_claim_settlement",
    "idempotent_claim_settlement_record",
    "claim_settlement_requires_resolved_delivery_exception",
    "claim_settlement_requires_claim_reference",
    "claim_settlement_requires_matching_claim_reference",
    "claim_settlement_requires_claim_accepted_resolution",
    "claim_settlement_cannot_precede_exception_resolution",
    "claim_settlement_blocks_duplicate_exception_settlement",
    "claim_settlement_blocks_duplicate_settlement_reference",
    "claim_settlement_creates_audit_and_outbox",
  ];

  if (!resolvedException) {
    appliedRules.push("claim_settlement_blocked_until_exception_resolved");
  }

  if (!claimReferencePresent) {
    appliedRules.push("claim_settlement_blocked_without_claim_reference");
  }

  if (!claimReferenceMatched) {
    appliedRules.push("claim_settlement_blocked_by_claim_reference_mismatch");
  }

  if (!claimResolutionAccepted) {
    appliedRules.push("claim_settlement_blocked_until_claim_accepted");
  }

  if (!settlementAfterResolution) {
    appliedRules.push("claim_settlement_cannot_precede_resolution_timestamp");
  }

  if (duplicateSettlementBlocked) {
    appliedRules.push("claim_settlement_blocked_by_existing_exception_settlement");
  }

  if (duplicateReferenceBlocked) {
    appliedRules.push("claim_settlement_blocked_by_duplicate_reference");
  }

  if (settlementAllowed) {
    appliedRules.push("claim_settlement_accounting_recorded");
  }

  return {
    settlementAllowed,
    resolvedException,
    claimReferencePresent,
    claimReferenceMatched,
    claimResolutionAccepted,
    settlementAfterResolution,
    duplicateSettlementBlocked,
    duplicateReferenceBlocked,
    appliedRules,
  };
}

export function createRecordedClaimSettlementBusinessRules(
  exception: CargoDeliveryExceptionRecord,
): CargoClaimSettlementRecordOutput["businessRules"] {
  return {
    settlementAllowed: true,
    resolvedException: exception.status === "resolved",
    claimReferencePresent: exception.claimReference !== null,
    claimReferenceMatched: true,
    claimResolutionAccepted: exception.resolutionCode === "claim_accepted",
    settlementAfterResolution: true,
    duplicateSettlementBlocked: false,
    duplicateReferenceBlocked: false,
    appliedRules: [
      "tenant_scoped_claim_settlement",
      "idempotent_claim_settlement_record_replay",
      "claim_settlement_accounting_recorded",
    ],
  };
}

export function resolveCargoComplianceEvidenceRecordBusinessRules(
  cargo: CargoRecord,
  input: CargoComplianceEvidenceRecordInput,
): CargoComplianceEvidenceRecordOutput["businessRules"] {
  const notCancelled = cargo.status !== "cancelled";
  const notExpiredAtRecord =
    input.expiresAt === undefined || Date.parse(input.expiresAt) > Date.now();
  const hazardousEvidenceMatchesCargo =
    input.evidenceType !== "hazardous_goods_declaration" || cargo.hazardous;
  const evidenceAccepted = notCancelled && notExpiredAtRecord && hazardousEvidenceMatchesCargo;
  const appliedRules = [
    "tenant_scoped_compliance_evidence",
    "idempotent_compliance_evidence_record",
    "unique_document_reference_per_cargo_and_type",
    "compliance_evidence_requires_human_review",
    "compliance_evidence_creates_audit_and_outbox",
  ];

  if (!notCancelled) {
    appliedRules.push("compliance_evidence_blocked_for_cancelled_cargo");
  }

  if (!notExpiredAtRecord) {
    appliedRules.push("compliance_evidence_blocked_when_already_expired");
  }

  if (!hazardousEvidenceMatchesCargo) {
    appliedRules.push("hazardous_declaration_requires_hazardous_cargo");
  }

  if (cargo.hazardous) {
    appliedRules.push("hazardous_cargo_requires_dedicated_compliance_evidence");
  }

  return {
    evidenceAccepted,
    reviewRequired: true,
    appliedRules,
  };
}

export function resolveCargoComplianceEvidenceVerifyBusinessRules(
  evidence: CargoComplianceEvidenceWithCargo,
  input: CargoComplianceEvidenceVerifyInput,
): CargoComplianceEvidenceVerifyOutput["businessRules"] {
  const reviewedAt = input.reviewedAt === undefined ? new Date() : new Date(input.reviewedAt);
  const pendingReview = evidence.status === "pending_review";
  const cargoNotCancelled = evidence.cargo.status !== "cancelled";
  const approvalNotExpired =
    input.status === "rejected" || evidence.expiresAt === null || evidence.expiresAt > reviewedAt;
  const verificationAllowed = pendingReview && cargoNotCancelled && approvalNotExpired;
  const appliedRules = [
    "tenant_scoped_compliance_review",
    "idempotent_compliance_evidence_verify",
    "verification_requires_pending_review_status",
    "approved_evidence_must_not_be_expired",
    "rejected_evidence_requires_rejection_reason",
    "compliance_verification_creates_audit_and_outbox",
  ];

  if (!pendingReview) {
    appliedRules.push("compliance_verification_blocked_after_terminal_review");
  }

  if (!cargoNotCancelled) {
    appliedRules.push("compliance_verification_blocked_for_cancelled_cargo");
  }

  if (!approvalNotExpired) {
    appliedRules.push("compliance_approval_blocked_for_expired_evidence");
  }

  if (input.status === "approved") {
    appliedRules.push("compliance_evidence_approved_for_operations");
  }

  if (input.status === "rejected") {
    appliedRules.push("compliance_evidence_rejected_blocks_automation");
  }

  return {
    verificationAllowed,
    evidenceApproved: verificationAllowed && input.status === "approved",
    evidenceRejected: verificationAllowed && input.status === "rejected",
    appliedRules,
  };
}

export function createRecordedComplianceEvidenceBusinessRules(
  evidence: CargoComplianceEvidenceRecord,
): CargoComplianceEvidenceRecordOutput["businessRules"] {
  return {
    evidenceAccepted: evidence.recordIdempotencyKey !== null,
    reviewRequired: true,
    appliedRules: [
      "tenant_scoped_compliance_evidence",
      "idempotent_compliance_evidence_record_replay",
      "compliance_evidence_requires_human_review",
    ],
  };
}

export function createVerifiedComplianceEvidenceBusinessRules(
  evidence: CargoComplianceEvidenceRecord,
): CargoComplianceEvidenceVerifyOutput["businessRules"] {
  return {
    verificationAllowed: evidence.verifyIdempotencyKey !== null,
    evidenceApproved: evidence.status === "approved",
    evidenceRejected: evidence.status === "rejected",
    appliedRules: [
      "tenant_scoped_compliance_review",
      "idempotent_compliance_evidence_verify_replay",
      evidence.status === "approved"
        ? "compliance_evidence_approved_for_operations"
        : "compliance_evidence_rejected_blocks_automation",
    ],
  };
}

// ---- Utility functions ----

export function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 10;
  }

  return Math.min(Math.max(limit, 1), 50);
}

export function normalizeCargoReference(reference: string): string {
  return reference.trim().toUpperCase();
}
