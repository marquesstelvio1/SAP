import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

process.env.PRISMA_HIDE_QUERY_LOGS = "true";

import type { PrismaClient } from "../generated/prisma/client.js";
import { getPrismaClient, seedRbacBootstrap } from "../src/index.js";

const database = getPrismaClient();
const localDemoDefaults = {
  organizationName: "SAPTM Local",
  organizationSlug: "saptm-local",
  sourceSystem: "local-demo-seed",
} as const;

try {
  console.log("Iniciando o processo de seed...");
  const organizationId = process.env.SAPTM_BOOTSTRAP_ORGANIZATION_ID;
  await seedRbacBootstrap({
    database,
    ...(organizationId === undefined ? {} : { organizationId }),
  });
  await seedLocalDemoData(database);

  console.log("✅ Seed concluído com sucesso.");
} finally {
  await database.$disconnect();
}

type DemoSeedResult = {
  organizationSlug: string;
  cargoRecords: number;
  trackingShipments: number;
  capacitySlots: number;
  transportOrders: number;
  tariffQuotes: number;
};

async function seedLocalDemoData(database: PrismaClient): Promise<DemoSeedResult> {
  assertDemoSeedAllowed();

  const now = new Date();
  const organization = await database.organization.upsert({
    where: {
      slug: readEnv("SAPTM_LOCAL_ORGANIZATION_SLUG", localDemoDefaults.organizationSlug),
    },
    update: {
      name: readEnv("SAPTM_LOCAL_ORGANIZATION_NAME", localDemoDefaults.organizationName),
      status: "active",
    },
    create: {
      name: readEnv("SAPTM_LOCAL_ORGANIZATION_NAME", localDemoDefaults.organizationName),
      slug: readEnv("SAPTM_LOCAL_ORGANIZATION_SLUG", localDemoDefaults.organizationSlug),
      status: "active",
    },
    select: {
      id: true,
      slug: true,
    },
  });

  await seedRbacBootstrap({
    database,
    organizationId: organization.id,
  });

  const trackingShipments = await seedTrackingDemoData(database, organization.id, now);
  const cargoRecords = await seedCargoDemoData(database, organization.id, trackingShipments, now);
  const capacitySlots = await seedCapacityDemoData(database, organization.id, cargoRecords, now);
  const transportOrders = await seedPlanningDemoData(database, organization.id, cargoRecords, now);
  const tariffQuotes = await seedTariffDemoData(database, organization.id, cargoRecords, now);
  await seedOperationalEvidence(database, organization.id, cargoRecords, trackingShipments, now);
  await seedReleaseEvidenceEvents(database, organization.id, now);

  return {
    organizationSlug: organization.slug,
    cargoRecords: cargoRecords.length,
    trackingShipments: trackingShipments.length,
    capacitySlots: capacitySlots.length,
    transportOrders: transportOrders.length,
    tariffQuotes: tariffQuotes.length,
  };
}

async function seedTrackingDemoData(database: PrismaClient, organizationId: string, now: Date) {
  const railShipment = await database.trackingShipment.upsert({
    where: {
      organizationId_referenceCode: {
        organizationId,
        referenceCode: "TRK-LOCAL-RAIL-001",
      },
    },
    update: {
      cargoDescription: "Contentores ferroviarios para exportacao",
      destinationName: "Porto de Luanda",
      estimatedArrivalAt: addHours(now, 18),
      externalReference: "SAPTM-DEMO-RAIL-001",
      originName: "Terminal Ferroviario do Lobito",
      plannedDepartureAt: addHours(now, -8),
      priority: 2,
      status: "in_transit",
      transportMode: "rail",
    },
    create: {
      id: "local_demo_tracking_rail_001",
      organizationId,
      referenceCode: "TRK-LOCAL-RAIL-001",
      cargoDescription: "Contentores ferroviarios para exportacao",
      destinationName: "Porto de Luanda",
      estimatedArrivalAt: addHours(now, 18),
      externalReference: "SAPTM-DEMO-RAIL-001",
      originName: "Terminal Ferroviario do Lobito",
      plannedDepartureAt: addHours(now, -8),
      priority: 2,
      status: "in_transit",
      transportMode: "rail",
    },
  });
  const portShipment = await database.trackingShipment.upsert({
    where: {
      organizationId_referenceCode: {
        organizationId,
        referenceCode: "TRK-LOCAL-PORT-002",
      },
    },
    update: {
      cargoDescription: "Carga perigosa retida para inspecao documental",
      destinationName: "Armazem alfandegado Viana",
      estimatedArrivalAt: addHours(now, 30),
      externalReference: "SAPTM-DEMO-PORT-002",
      originName: "Porto de Namibe",
      plannedDepartureAt: addHours(now, -4),
      priority: 1,
      status: "exception",
      transportMode: "port",
    },
    create: {
      id: "local_demo_tracking_port_002",
      organizationId,
      referenceCode: "TRK-LOCAL-PORT-002",
      cargoDescription: "Carga perigosa retida para inspecao documental",
      destinationName: "Armazem alfandegado Viana",
      estimatedArrivalAt: addHours(now, 30),
      externalReference: "SAPTM-DEMO-PORT-002",
      originName: "Porto de Namibe",
      plannedDepartureAt: addHours(now, -4),
      priority: 1,
      status: "exception",
      transportMode: "port",
    },
  });
  const completedShipment = await database.trackingShipment.upsert({
    where: {
      organizationId_referenceCode: {
        organizationId,
        referenceCode: "TRK-LOCAL-MULTI-003",
      },
    },
    update: {
      actualArrivalAt: addHours(now, -18),
      cargoDescription: "Equipamento industrial entregue ao cliente final",
      destinationName: "Zona Industrial de Viana",
      estimatedArrivalAt: addHours(now, -20),
      externalReference: "SAPTM-DEMO-MULTI-003",
      originName: "Porto de Luanda",
      plannedDepartureAt: addHours(now, -44),
      priority: 3,
      status: "completed",
      transportMode: "multimodal",
    },
    create: {
      id: "local_demo_tracking_multi_003",
      organizationId,
      referenceCode: "TRK-LOCAL-MULTI-003",
      actualArrivalAt: addHours(now, -18),
      cargoDescription: "Equipamento industrial entregue ao cliente final",
      destinationName: "Zona Industrial de Viana",
      estimatedArrivalAt: addHours(now, -20),
      externalReference: "SAPTM-DEMO-MULTI-003",
      originName: "Porto de Luanda",
      plannedDepartureAt: addHours(now, -44),
      priority: 3,
      status: "completed",
      transportMode: "multimodal",
    },
  });

  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_rail_created",
    organizationId,
    shipmentId: railShipment.id,
    eventType: "created",
    occurredAt: addHours(now, -10),
    locationName: "Terminal Ferroviario do Lobito",
    notes: "Shipment criado a partir de carga liberada.",
    payload: {
      source: "cargo.transport.plan",
    },
  });
  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_rail_departed",
    organizationId,
    shipmentId: railShipment.id,
    eventType: "departed",
    occurredAt: addHours(now, -8),
    locationName: "Terminal Ferroviario do Lobito",
    notes: "Partida ferroviaria confirmada pelo operador.",
    payload: {
      train: "CFB-742",
    },
  });
  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_rail_location",
    organizationId,
    shipmentId: railShipment.id,
    eventType: "location_updated",
    occurredAt: addHours(now, -2),
    locationName: "Corredor Lobito - Malanje",
    notes: "Atualizacao operacional de posicao.",
    payload: {
      etaRisk: "normal",
    },
  });
  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_port_created",
    organizationId,
    shipmentId: portShipment.id,
    eventType: "created",
    occurredAt: addHours(now, -6),
    locationName: "Porto de Namibe",
    notes: "Carga perigosa registada para fluxo portuario.",
    payload: {
      hazardClass: "3",
    },
  });
  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_port_hold",
    organizationId,
    shipmentId: portShipment.id,
    eventType: "customs_hold",
    occurredAt: addHours(now, -3),
    locationName: "Porto de Namibe",
    notes: "Retencao aduaneira por divergencia documental.",
    payload: {
      customsReference: "CUST-HOLD-LOCAL-002",
    },
  });
  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_multi_arrived",
    organizationId,
    shipmentId: completedShipment.id,
    eventType: "arrived",
    occurredAt: addHours(now, -18),
    locationName: "Zona Industrial de Viana",
    notes: "Chegada confirmada.",
    payload: {
      deliveryWindow: "met",
    },
  });
  await upsertTrackingEvent(database, {
    id: "local_demo_tracking_event_multi_handover",
    organizationId,
    shipmentId: completedShipment.id,
    eventType: "handover_completed",
    occurredAt: addHours(now, -16),
    locationName: "Zona Industrial de Viana",
    notes: "Handover concluido ao consignatario.",
    payload: {
      receivedBy: "Cliente Final Demo",
    },
  });

  return [railShipment, portShipment, completedShipment];
}

async function seedCargoDemoData(
  database: PrismaClient,
  organizationId: string,
  trackingShipments: Awaited<ReturnType<typeof seedTrackingDemoData>>,
  now: Date,
) {
  const [railShipment, portShipment, completedShipment] = trackingShipments;
  const railCargo = await database.cargo.upsert({
    where: {
      organizationId_cargoReference: {
        organizationId,
        cargoReference: "CGO-LOCAL-RAIL-001",
      },
    },
    update: {
      arrivalLocationName: null,
      arrivalOperatorName: null,
      arrivalReference: null,
      arrivedAt: null,
      cargoDescription: "Contentores ferroviarios para exportacao",
      cargoType: "container",
      carrierReference: "CFB-742",
      conditionStatus: "sound",
      consigneeName: "Porto de Luanda",
      custodyOwnerName: "CFB Operations",
      customsReference: "CUST-CLR-LOCAL-001",
      customsStatus: "cleared",
      deliveredAt: null,
      deliveryNotes: null,
      deliveryReference: null,
      departureLocationName: "Terminal Ferroviario do Lobito",
      departureOperatorName: "Operador Ferroviario Local",
      departureReference: "DEP-LOCAL-001",
      departedAt: addHours(now, -8),
      destinationName: "Porto de Luanda",
      expectedReadyAt: addHours(now, -12),
      externalReference: "ERP-LOCAL-CGO-001",
      grossWeightKg: "28400.000",
      hazardous: false,
      originName: "Terminal Ferroviario do Lobito",
      packageCount: 2,
      priority: 2,
      receivedByName: null,
      releaseIdempotencyKey: "local-demo-release-001",
      releaseReason: "Compliance aprovado para transporte ferroviario.",
      releaseReference: "REL-LOCAL-001",
      releasedAt: addHours(now, -9),
      requiresInspection: false,
      shipperName: "Angola Rail Export SA",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "in_transport",
      trackingShipmentId: railShipment.id,
      transportOwnerTeam: "Rail Ops",
      transportPlannedAt: addHours(now, -10),
      transportPlanningReference: "PLAN-LOCAL-001",
      volumeM3: "67.500",
    },
    create: {
      id: "local_demo_cargo_rail_001",
      organizationId,
      cargoReference: "CGO-LOCAL-RAIL-001",
      cargoDescription: "Contentores ferroviarios para exportacao",
      cargoType: "container",
      carrierReference: "CFB-742",
      conditionStatus: "sound",
      consigneeName: "Porto de Luanda",
      custodyOwnerName: "CFB Operations",
      customsReference: "CUST-CLR-LOCAL-001",
      customsStatus: "cleared",
      departureLocationName: "Terminal Ferroviario do Lobito",
      departureOperatorName: "Operador Ferroviario Local",
      departureReference: "DEP-LOCAL-001",
      departedAt: addHours(now, -8),
      destinationName: "Porto de Luanda",
      expectedReadyAt: addHours(now, -12),
      externalReference: "ERP-LOCAL-CGO-001",
      grossWeightKg: "28400.000",
      hazardous: false,
      originName: "Terminal Ferroviario do Lobito",
      packageCount: 2,
      priority: 2,
      registrationIdempotencyKey: "local-demo-cargo-register-001",
      releaseIdempotencyKey: "local-demo-release-001",
      releaseReason: "Compliance aprovado para transporte ferroviario.",
      releaseReference: "REL-LOCAL-001",
      releasedAt: addHours(now, -9),
      requiresInspection: false,
      shipperName: "Angola Rail Export SA",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "in_transport",
      trackingShipmentId: railShipment.id,
      transportOwnerTeam: "Rail Ops",
      transportPlanIdempotencyKey: "local-demo-transport-plan-001",
      departureIdempotencyKey: "local-demo-departure-001",
      transportPlannedAt: addHours(now, -10),
      transportPlanningReference: "PLAN-LOCAL-001",
      volumeM3: "67.500",
    },
  });
  const heldCargo = await database.cargo.upsert({
    where: {
      organizationId_cargoReference: {
        organizationId,
        cargoReference: "CGO-LOCAL-PORT-002",
      },
    },
    update: {
      cargoDescription: "Carga perigosa retida para validacao aduaneira",
      cargoType: "hazardous",
      conditionStatus: "requires_inspection",
      consigneeName: "Viana Chemical Storage",
      custodyOwnerName: "Port Operations",
      customsReference: "CUST-HOLD-LOCAL-002",
      customsStatus: "held",
      destinationName: "Armazem alfandegado Viana",
      expectedReadyAt: addHours(now, 10),
      externalReference: "ERP-LOCAL-CGO-002",
      grossWeightKg: "7400.000",
      hazardClass: "3",
      hazardous: true,
      originName: "Porto de Namibe",
      packageCount: 24,
      priority: 1,
      requiresInspection: true,
      shipperName: "Namibe Energy Logistics",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "held",
      trackingShipmentId: portShipment.id,
      unNumber: "UN1203",
      volumeM3: "18.250",
    },
    create: {
      id: "local_demo_cargo_port_002",
      organizationId,
      cargoReference: "CGO-LOCAL-PORT-002",
      cargoDescription: "Carga perigosa retida para validacao aduaneira",
      cargoType: "hazardous",
      conditionStatus: "requires_inspection",
      consigneeName: "Viana Chemical Storage",
      custodyOwnerName: "Port Operations",
      customsReference: "CUST-HOLD-LOCAL-002",
      customsStatus: "held",
      destinationName: "Armazem alfandegado Viana",
      expectedReadyAt: addHours(now, 10),
      externalReference: "ERP-LOCAL-CGO-002",
      grossWeightKg: "7400.000",
      hazardClass: "3",
      hazardous: true,
      originName: "Porto de Namibe",
      packageCount: 24,
      priority: 1,
      registrationIdempotencyKey: "local-demo-cargo-register-002",
      requiresInspection: true,
      shipperName: "Namibe Energy Logistics",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "held",
      trackingShipmentId: portShipment.id,
      unNumber: "UN1203",
      volumeM3: "18.250",
    },
  });
  const deliveredCargo = await database.cargo.upsert({
    where: {
      organizationId_cargoReference: {
        organizationId,
        cargoReference: "CGO-LOCAL-DEL-003",
      },
    },
    update: {
      arrivedAt: addHours(now, -18),
      cargoDescription: "Equipamento industrial entregue ao cliente final",
      cargoType: "break_bulk",
      conditionStatus: "sound",
      consigneeName: "Cliente Final Demo",
      custodyOwnerName: "Customer",
      customsReference: "CUST-CLR-LOCAL-003",
      customsStatus: "cleared",
      deliveredAt: addHours(now, -16),
      deliveryNotes: "Entrega aceite com ressalva de claim operacional ja liquidada.",
      deliveryReference: "DEL-LOCAL-003",
      destinationName: "Zona Industrial de Viana",
      expectedReadyAt: addHours(now, -48),
      grossWeightKg: "12800.000",
      originName: "Porto de Luanda",
      packageCount: 5,
      priority: 3,
      receivedByName: "Cliente Final Demo",
      releaseReference: "REL-LOCAL-003",
      releasedAt: addHours(now, -46),
      requiresInspection: false,
      shipperName: "Luanda Port Logistics",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "delivered",
      trackingShipmentId: completedShipment.id,
      volumeM3: "42.000",
    },
    create: {
      id: "local_demo_cargo_delivered_003",
      organizationId,
      cargoReference: "CGO-LOCAL-DEL-003",
      arrivedAt: addHours(now, -18),
      cargoDescription: "Equipamento industrial entregue ao cliente final",
      cargoType: "break_bulk",
      conditionStatus: "sound",
      consigneeName: "Cliente Final Demo",
      custodyOwnerName: "Customer",
      customsReference: "CUST-CLR-LOCAL-003",
      customsStatus: "cleared",
      deliveredAt: addHours(now, -16),
      deliveryIdempotencyKey: "local-demo-delivery-003",
      deliveryNotes: "Entrega aceite com ressalva de claim operacional ja liquidada.",
      deliveryReference: "DEL-LOCAL-003",
      destinationName: "Zona Industrial de Viana",
      expectedReadyAt: addHours(now, -48),
      grossWeightKg: "12800.000",
      originName: "Porto de Luanda",
      packageCount: 5,
      priority: 3,
      registrationIdempotencyKey: "local-demo-cargo-register-003",
      releaseIdempotencyKey: "local-demo-release-003",
      releaseReference: "REL-LOCAL-003",
      releasedAt: addHours(now, -46),
      requiresInspection: false,
      shipperName: "Luanda Port Logistics",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "delivered",
      trackingShipmentId: completedShipment.id,
      volumeM3: "42.000",
    },
  });
  const capacityCargoOne = await upsertReadyCargo(database, {
    id: "local_demo_cargo_capacity_004",
    organizationId,
    cargoReference: "CGO-LOCAL-CAP-004",
    cargoDescription: "Contentor refrigerado para janela de capacidade saturada",
    cargoType: "refrigerated",
    grossWeightKg: "9600.000",
    packageCount: 1,
    volumeM3: "32.000",
    now,
  });
  const capacityCargoTwo = await upsertReadyCargo(database, {
    id: "local_demo_cargo_capacity_005",
    organizationId,
    cargoReference: "CGO-LOCAL-CAP-005",
    cargoDescription: "Carga solta para balanceamento de reservas",
    cargoType: "break_bulk",
    grossWeightKg: "5200.000",
    packageCount: 12,
    volumeM3: "25.000",
    now,
  });
  const planningRescheduleCargo = await upsertReadyCargo(database, {
    id: "local_demo_cargo_planning_reschedule_006",
    organizationId,
    cargoReference: "CGO-LOCAL-PLAN-006",
    cargoDescription: "Carga solta para replaneamento operacional demo",
    cargoType: "break_bulk",
    grossWeightKg: "6100.000",
    packageCount: 10,
    volumeM3: "28.000",
    now,
  });
  const planningCancelCargo = await upsertReadyCargo(database, {
    id: "local_demo_cargo_planning_cancel_007",
    organizationId,
    cargoReference: "CGO-LOCAL-PLAN-007",
    cargoDescription: "Carga refrigerada para cancelamento operacional demo",
    cargoType: "refrigerated",
    grossWeightKg: "7300.000",
    packageCount: 2,
    volumeM3: "31.000",
    now,
  });

  return [
    railCargo,
    heldCargo,
    deliveredCargo,
    capacityCargoOne,
    capacityCargoTwo,
    planningRescheduleCargo,
    planningCancelCargo,
  ];
}

async function seedCapacityDemoData(
  database: PrismaClient,
  organizationId: string,
  cargoRecords: Awaited<ReturnType<typeof seedCargoDemoData>>,
  now: Date,
) {
  const [railCargo, heldCargo, _deliveredCargo, capacityCargoOne, capacityCargoTwo] = cargoRecords;
  const railResource = await database.capacityResource.upsert({
    where: {
      organizationId_resourceCode: {
        organizationId,
        resourceCode: "CAP-LOCAL-RAIL-TRACK-01",
      },
    },
    update: {
      locationName: "Terminal Ferroviario do Lobito",
      maxConcurrentBookings: 10,
      resourceName: "Linha ferroviaria demo 01",
      resourceType: "rail_track",
      sourceSystem: localDemoDefaults.sourceSystem,
    },
    create: {
      id: "local_demo_capacity_resource_rail_01",
      organizationId,
      locationName: "Terminal Ferroviario do Lobito",
      maxConcurrentBookings: 10,
      recordIdempotencyKey: "local-demo-capacity-resource-rail-01",
      resourceCode: "CAP-LOCAL-RAIL-TRACK-01",
      resourceName: "Linha ferroviaria demo 01",
      resourceType: "rail_track",
      sourceSystem: localDemoDefaults.sourceSystem,
    },
  });
  const gateResource = await database.capacityResource.upsert({
    where: {
      organizationId_resourceCode: {
        organizationId,
        resourceCode: "CAP-LOCAL-GATE-02",
      },
    },
    update: {
      locationName: "Porto de Luanda Gate 2",
      maxConcurrentBookings: 6,
      resourceName: "Gate portuario demo 02",
      resourceType: "gate",
      sourceSystem: localDemoDefaults.sourceSystem,
    },
    create: {
      id: "local_demo_capacity_resource_gate_02",
      organizationId,
      locationName: "Porto de Luanda Gate 2",
      maxConcurrentBookings: 6,
      recordIdempotencyKey: "local-demo-capacity-resource-gate-02",
      resourceCode: "CAP-LOCAL-GATE-02",
      resourceName: "Gate portuario demo 02",
      resourceType: "gate",
      sourceSystem: localDemoDefaults.sourceSystem,
    },
  });
  const saturatedSlot = await upsertCapacitySlot(database, {
    id: "local_demo_capacity_slot_saturated_001",
    organizationId,
    resourceId: railResource.id,
    slotReference: "SLOT-LOCAL-SAT-001",
    windowStartAt: addHours(now, 2),
    windowEndAt: addHours(now, 20),
    capacityUnits: 10,
    reservedUnits: 9,
    status: "open",
    idempotencyKey: "local-demo-capacity-slot-sat-001",
  });
  const unusedSlot = await upsertCapacitySlot(database, {
    id: "local_demo_capacity_slot_unused_002",
    organizationId,
    resourceId: railResource.id,
    slotReference: "SLOT-LOCAL-UNUSED-002",
    windowStartAt: addHours(now, 8),
    windowEndAt: addHours(now, 40),
    capacityUnits: 8,
    reservedUnits: 0,
    status: "open",
    idempotencyKey: "local-demo-capacity-slot-unused-002",
  });
  const cancellationSlot = await upsertCapacitySlot(database, {
    id: "local_demo_capacity_slot_cancel_003",
    organizationId,
    resourceId: gateResource.id,
    slotReference: "SLOT-LOCAL-CANCEL-003",
    windowStartAt: addHours(now, 4),
    windowEndAt: addHours(now, 18),
    capacityUnits: 6,
    reservedUnits: 0,
    status: "open",
    idempotencyKey: "local-demo-capacity-slot-cancel-003",
  });

  await upsertCapacityReservation(database, {
    id: "local_demo_capacity_reservation_001",
    organizationId,
    cargoId: railCargo.id,
    slotId: saturatedSlot.id,
    reservationReference: "RES-LOCAL-SAT-001",
    reservationPurpose: "departure",
    status: "reserved",
    reservedUnits: 3,
    reservedByName: "SAPTM Local Admin",
    reservedAt: addHours(now, -2),
    reserveIdempotencyKey: "local-demo-capacity-reserve-001",
  });
  await upsertCapacityReservation(database, {
    id: "local_demo_capacity_reservation_002",
    organizationId,
    cargoId: capacityCargoOne.id,
    slotId: saturatedSlot.id,
    reservationReference: "RES-LOCAL-SAT-002",
    reservationPurpose: "departure",
    status: "reserved",
    reservedUnits: 3,
    reservedByName: "SAPTM Local Admin",
    reservedAt: addHours(now, -1),
    reserveIdempotencyKey: "local-demo-capacity-reserve-002",
  });
  await upsertCapacityReservation(database, {
    id: "local_demo_capacity_reservation_003",
    organizationId,
    cargoId: capacityCargoTwo.id,
    slotId: saturatedSlot.id,
    reservationReference: "RES-LOCAL-SAT-003",
    reservationPurpose: "departure",
    status: "reserved",
    reservedUnits: 3,
    reservedByName: "SAPTM Local Admin",
    reservedAt: addMinutes(now, -30),
    reserveIdempotencyKey: "local-demo-capacity-reserve-003",
  });
  await upsertCapacityReservation(database, {
    id: "local_demo_capacity_reservation_004",
    organizationId,
    cargoId: heldCargo.id,
    slotId: cancellationSlot.id,
    reservationReference: "RES-LOCAL-CANCEL-004",
    reservationPurpose: "handoff",
    status: "cancelled",
    reservedUnits: 2,
    reservedByName: "SAPTM Local Admin",
    reservedAt: addHours(now, -6),
    cancellationReference: "CANCEL-LOCAL-004",
    cancelledByName: "SAPTM Local Admin",
    cancellationReason: "Carga retida por customs hold.",
    cancelledAt: addHours(now, -3),
    reserveIdempotencyKey: "local-demo-capacity-reserve-004",
    cancelIdempotencyKey: "local-demo-capacity-cancel-004",
  });
  await upsertCapacityReservation(database, {
    id: "local_demo_capacity_reservation_005",
    organizationId,
    cargoId: capacityCargoOne.id,
    slotId: cancellationSlot.id,
    reservationReference: "RES-LOCAL-CANCEL-005",
    reservationPurpose: "storage",
    status: "cancelled",
    reservedUnits: 1,
    reservedByName: "SAPTM Local Admin",
    reservedAt: addHours(now, -7),
    cancellationReference: "CANCEL-LOCAL-005",
    cancelledByName: "SAPTM Local Admin",
    cancellationReason: "Janela replaneada por capacidade portuaria.",
    cancelledAt: addHours(now, -4),
    reserveIdempotencyKey: "local-demo-capacity-reserve-005",
    cancelIdempotencyKey: "local-demo-capacity-cancel-005",
  });

  await database.capacityAdvisoryDecision.upsert({
    where: {
      organizationId_recommendationId: {
        organizationId,
        recommendationId: `capacity-advisory:slot_saturation:${saturatedSlot.id}`,
      },
    },
    update: {
      decidedAt: addMinutes(now, -10),
      decidedByName: "SAPTM Local Admin",
      decisionReason:
        "Aprovada abertura de capacidade adicional para evitar bloqueio da janela ferroviaria.",
      decisionStatus: "approved",
      recommendationType: "slot_saturation",
      requiredPermission: "capacity.manage",
      slotId: saturatedSlot.id,
      sourceSystem: localDemoDefaults.sourceSystem,
    },
    create: {
      id: "local_demo_capacity_advisory_decision_001",
      organizationId,
      approvalReference: "CAP-APPROVAL-LOCAL-001",
      decidedAt: addMinutes(now, -10),
      decidedByName: "SAPTM Local Admin",
      decisionIdempotencyKey: "local-demo-capacity-advisory-decision-001",
      decisionReason:
        "Aprovada abertura de capacidade adicional para evitar bloqueio da janela ferroviaria.",
      decisionStatus: "approved",
      recommendationId: `capacity-advisory:slot_saturation:${saturatedSlot.id}`,
      recommendationType: "slot_saturation",
      requiredPermission: "capacity.manage",
      slotId: saturatedSlot.id,
      sourceSystem: localDemoDefaults.sourceSystem,
    },
  });

  return [saturatedSlot, unusedSlot, cancellationSlot];
}

async function seedPlanningDemoData(
  database: PrismaClient,
  organizationId: string,
  cargoRecords: Awaited<ReturnType<typeof seedCargoDemoData>>,
  now: Date,
) {
  const [
    _railCargo,
    _heldCargo,
    _deliveredCargo,
    _capacityCargoOne,
    capacityCargoTwo,
    planningRescheduleCargo,
    planningCancelCargo,
  ] = cargoRecords;

  await database.transportOrderScheduleRevision.updateMany({
    where: {
      orderId: {
        in: [
          "local_demo_transport_order_001",
          "local_demo_transport_order_reschedule_001",
          "local_demo_transport_order_cancel_001",
        ],
      },
    },
    data: {
      deletedAt: new Date(),
    },
  });
  await database.transportOrderDispatch.updateMany({
    where: {
      orderId: {
        in: [
          "local_demo_transport_order_001",
          "local_demo_transport_order_reschedule_001",
          "local_demo_transport_order_cancel_001",
        ],
      },
    },
    data: {
      deletedAt: new Date(),
    },
  });

  const confirmedOrder = await database.transportOrder.upsert({
    where: {
      organizationId_orderReference: {
        organizationId,
        orderReference: "TO-LOCAL-CAP-001",
      },
    },
    update: {
      capacityReservationId: "local_demo_capacity_reservation_003",
      cargoId: capacityCargoTwo.id,
      carrierName: "CFB Logistics",
      confirmationReference: "CNF-TO-LOCAL-CAP-001",
      confirmIdempotencyKey: "local-demo-planning-confirm-001",
      confirmedAt: addMinutes(now, -20),
      destinationName: "Porto de Luanda",
      mode: "rail",
      originName: "Terminal Ferroviario do Lobito",
      plannedArrivalAt: addHours(now, 16),
      plannedDepartureAt: addHours(now, 8),
      responsiblePlannerName: "SAPTM Local Admin",
      routeSummary: "Terminal ferroviario do Lobito para Porto de Luanda via corredor CFB.",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "confirmed",
      trackingShipmentId: null,
      cancellationReference: null,
      cancelledByName: null,
      cancellationReason: null,
      cancelledAt: null,
      cancelIdempotencyKey: null,
    },
    create: {
      id: "local_demo_transport_order_001",
      organizationId,
      capacityReservationId: "local_demo_capacity_reservation_003",
      cargoId: capacityCargoTwo.id,
      carrierName: "CFB Logistics",
      confirmIdempotencyKey: "local-demo-planning-confirm-001",
      confirmationReference: "CNF-TO-LOCAL-CAP-001",
      confirmedAt: addMinutes(now, -20),
      destinationName: "Porto de Luanda",
      mode: "rail",
      orderReference: "TO-LOCAL-CAP-001",
      originName: "Terminal Ferroviario do Lobito",
      plannedArrivalAt: addHours(now, 16),
      plannedDepartureAt: addHours(now, 8),
      responsiblePlannerName: "SAPTM Local Admin",
      routeSummary: "Terminal ferroviario do Lobito para Porto de Luanda via corredor CFB.",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "confirmed",
      trackingShipmentId: null,
    },
  });
  const rescheduleOrder = await database.transportOrder.upsert({
    where: {
      organizationId_orderReference: {
        organizationId,
        orderReference: "TO-LOCAL-RESCHEDULE-001",
      },
    },
    update: {
      capacityReservationId: null,
      cargoId: planningRescheduleCargo.id,
      carrierName: "CFB Logistics",
      confirmationReference: "CNF-TO-LOCAL-RESCHEDULE-001",
      confirmIdempotencyKey: "local-demo-planning-confirm-reschedule-001",
      confirmedAt: addMinutes(now, -25),
      destinationName: "Porto de Luanda",
      mode: "rail",
      originName: "Terminal Ferroviario do Lobito",
      plannedArrivalAt: addHours(now, 18),
      plannedDepartureAt: addHours(now, 10),
      responsiblePlannerName: "SAPTM Local Admin",
      routeSummary: "Terminal ferroviario do Lobito para Porto de Luanda via corredor CFB.",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "confirmed",
      trackingShipmentId: null,
      cancellationReference: null,
      cancelledByName: null,
      cancellationReason: null,
      cancelledAt: null,
      cancelIdempotencyKey: null,
    },
    create: {
      id: "local_demo_transport_order_reschedule_001",
      organizationId,
      capacityReservationId: null,
      cargoId: planningRescheduleCargo.id,
      carrierName: "CFB Logistics",
      confirmIdempotencyKey: "local-demo-planning-confirm-reschedule-001",
      confirmationReference: "CNF-TO-LOCAL-RESCHEDULE-001",
      confirmedAt: addMinutes(now, -25),
      destinationName: "Porto de Luanda",
      mode: "rail",
      orderReference: "TO-LOCAL-RESCHEDULE-001",
      originName: "Terminal Ferroviario do Lobito",
      plannedArrivalAt: addHours(now, 18),
      plannedDepartureAt: addHours(now, 10),
      responsiblePlannerName: "SAPTM Local Admin",
      routeSummary: "Terminal ferroviario do Lobito para Porto de Luanda via corredor CFB.",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "confirmed",
      trackingShipmentId: null,
    },
  });
  const cancelOrder = await database.transportOrder.upsert({
    where: {
      organizationId_orderReference: {
        organizationId,
        orderReference: "TO-LOCAL-CANCEL-001",
      },
    },
    update: {
      capacityReservationId: null,
      cargoId: planningCancelCargo.id,
      carrierName: "Port Rail Cold Chain",
      confirmationReference: "CNF-TO-LOCAL-CANCEL-001",
      confirmIdempotencyKey: "local-demo-planning-confirm-cancel-001",
      confirmedAt: addMinutes(now, -15),
      destinationName: "Porto de Luanda",
      mode: "road",
      originName: "Terminal Ferroviario do Lobito",
      plannedArrivalAt: addHours(now, 14),
      plannedDepartureAt: addHours(now, 7),
      responsiblePlannerName: "SAPTM Local Admin",
      routeSummary: "Terminal ferroviario do Lobito para Porto de Luanda em janela refrigerada.",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "confirmed",
      trackingShipmentId: null,
      cancellationReference: null,
      cancelledByName: null,
      cancellationReason: null,
      cancelledAt: null,
      cancelIdempotencyKey: null,
    },
    create: {
      id: "local_demo_transport_order_cancel_001",
      organizationId,
      capacityReservationId: null,
      cargoId: planningCancelCargo.id,
      carrierName: "Port Rail Cold Chain",
      confirmIdempotencyKey: "local-demo-planning-confirm-cancel-001",
      confirmationReference: "CNF-TO-LOCAL-CANCEL-001",
      confirmedAt: addMinutes(now, -15),
      destinationName: "Porto de Luanda",
      mode: "road",
      orderReference: "TO-LOCAL-CANCEL-001",
      originName: "Terminal Ferroviario do Lobito",
      plannedArrivalAt: addHours(now, 14),
      plannedDepartureAt: addHours(now, 7),
      responsiblePlannerName: "SAPTM Local Admin",
      routeSummary: "Terminal ferroviario do Lobito para Porto de Luanda em janela refrigerada.",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "confirmed",
      trackingShipmentId: null,
    },
  });

  return [confirmedOrder, rescheduleOrder, cancelOrder];
}

async function seedTariffDemoData(
  database: PrismaClient,
  organizationId: string,
  cargoRecords: Awaited<ReturnType<typeof seedCargoDemoData>>,
  now: Date,
) {
  const [railCargo, heldCargo] = cargoRecords;
  const rateCard = await database.tariffRateCard.upsert({
    where: {
      organizationId_rateCardCode: {
        organizationId,
        rateCardCode: "RC-LOCAL-RAIL-2026",
      },
    },
    update: {
      currencyCode: "USD",
      rateCardName: "Tabela local ferrovia/porto 2026",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "active",
      validFrom: addDays(now, -30),
      validUntil: addDays(now, 180),
    },
    create: {
      id: "local_demo_tariff_rate_card_001",
      organizationId,
      currencyCode: "USD",
      rateCardCode: "RC-LOCAL-RAIL-2026",
      rateCardName: "Tabela local ferrovia/porto 2026",
      recordIdempotencyKey: "local-demo-rate-card-001",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "active",
      validFrom: addDays(now, -30),
      validUntil: addDays(now, 180),
    },
  });

  await upsertTariffRateRule(database, {
    id: "local_demo_tariff_rate_rule_001",
    organizationId,
    rateCardId: rateCard.id,
    ruleCode: "FREIGHT-WEIGHT-RAIL",
    chargeName: "Frete ferroviario por kg",
    chargeType: "freight",
    calculationBasis: "per_weight_kg",
    unitRate: "0.0325",
    flatAmount: null,
    percentageRate: null,
    minimumCharge: "450.00",
    originName: "Terminal Ferroviario do Lobito",
    destinationName: "Porto de Luanda",
    cargoType: "container",
    effectiveFrom: addDays(now, -30),
    effectiveUntil: addDays(now, 180),
    recordIdempotencyKey: "local-demo-rate-rule-001",
  });
  await upsertTariffRateRule(database, {
    id: "local_demo_tariff_rate_rule_002",
    organizationId,
    rateCardId: rateCard.id,
    ruleCode: "HANDLING-FLAT-PORT",
    chargeName: "Handling portuario",
    chargeType: "handling",
    calculationBasis: "flat",
    unitRate: null,
    flatAmount: "120.00",
    percentageRate: null,
    minimumCharge: null,
    originName: null,
    destinationName: null,
    cargoType: null,
    effectiveFrom: addDays(now, -30),
    effectiveUntil: addDays(now, 180),
    recordIdempotencyKey: "local-demo-rate-rule-002",
  });

  const approvedQuote = await upsertTariffQuote(database, {
    id: "local_demo_tariff_quote_001",
    organizationId,
    cargoId: railCargo.id,
    rateCardId: rateCard.id,
    quoteReference: "QUOTE-LOCAL-RAIL-001",
    status: "approved",
    currencyCode: "USD",
    quotedAmount: "1043.00",
    calculationPayload: {
      taxableAmount: 1043,
      taxRatePercentage: 0,
      taxAmount: 0,
      quotedAmount: 1043,
      lines: [
        {
          chargeType: "freight",
          basis: "per_weight_kg",
          amount: 923,
        },
        {
          chargeType: "handling",
          basis: "flat",
          amount: 120,
        },
      ],
      source: "local-demo-seed",
    },
    calculatedByName: "SAPTM Local Admin",
    calculatedAt: addHours(now, -5),
    approvedByName: "SAPTM Local Admin",
    approvalReference: "FIN-APPROVAL-LOCAL-001",
    approvalNotes: "Cotacao aprovada para transporte ferroviario demo.",
    approvedAt: addHours(now, -4),
    calculateIdempotencyKey: "local-demo-quote-calculate-001",
    approveIdempotencyKey: "local-demo-quote-approve-001",
  });
  const calculatedQuote = await upsertTariffQuote(database, {
    id: "local_demo_tariff_quote_002",
    organizationId,
    cargoId: heldCargo.id,
    rateCardId: rateCard.id,
    quoteReference: "QUOTE-LOCAL-PORT-002",
    status: "calculated",
    currencyCode: "USD",
    quotedAmount: "570.00",
    calculationPayload: {
      taxableAmount: 570,
      taxRatePercentage: 0,
      taxAmount: 0,
      quotedAmount: 570,
      lines: [
        {
          chargeType: "handling",
          basis: "flat",
          amount: 120,
        },
        {
          chargeType: "customs",
          basis: "flat",
          amount: 450,
        },
      ],
      source: "local-demo-seed",
    },
    calculatedByName: "SAPTM Local Admin",
    calculatedAt: addHours(now, -2),
    approvedByName: null,
    approvalReference: null,
    approvalNotes: null,
    approvedAt: null,
    calculateIdempotencyKey: "local-demo-quote-calculate-002",
    approveIdempotencyKey: null,
  });

  return [approvedQuote, calculatedQuote];
}

async function seedOperationalEvidence(
  database: PrismaClient,
  organizationId: string,
  cargoRecords: Awaited<ReturnType<typeof seedCargoDemoData>>,
  trackingShipments: Awaited<ReturnType<typeof seedTrackingDemoData>>,
  now: Date,
) {
  const [railCargo, heldCargo, deliveredCargo] = cargoRecords;
  const [railShipment, portShipment] = trackingShipments;

  await upsertCargoComplianceEvidence(database, {
    id: "local_demo_compliance_evidence_001",
    organizationId,
    cargoId: railCargo.id,
    evidenceType: "release_authorization",
    documentReference: "DOC-REL-LOCAL-001",
    documentTitle: "Autorizacao de liberacao ferroviaria",
    documentUri: "local://evidence/release-001",
    issuerName: "SAPTM Local Ops",
    issuedAt: addHours(now, -12),
    expiresAt: addDays(now, 14),
    status: "approved",
    reviewerName: "SAPTM Local Admin",
    reviewReference: "REV-LOCAL-001",
    reviewSummary: "Documento verificado para partida.",
    reviewedAt: addHours(now, -10),
    recordIdempotencyKey: "local-demo-compliance-record-001",
    verifyIdempotencyKey: "local-demo-compliance-verify-001",
    recordedByActorId: "local-demo-operator",
    reviewedByActorId: "local-demo-admin",
    recordedAt: addHours(now, -12),
  });
  await upsertCargoComplianceEvidence(database, {
    id: "local_demo_compliance_evidence_002",
    organizationId,
    cargoId: heldCargo.id,
    evidenceType: "hazardous_goods_declaration",
    documentReference: "DOC-HZD-LOCAL-002",
    documentTitle: "Declaracao de mercadorias perigosas",
    documentUri: "local://evidence/hazardous-002",
    issuerName: "Namibe Energy Logistics",
    issuedAt: addHours(now, -8),
    expiresAt: addDays(now, 7),
    status: "pending_review",
    reviewerName: null,
    reviewReference: null,
    reviewSummary: null,
    reviewedAt: null,
    recordIdempotencyKey: "local-demo-compliance-record-002",
    verifyIdempotencyKey: null,
    recordedByActorId: "local-demo-operator",
    reviewedByActorId: null,
    recordedAt: addHours(now, -8),
  });

  await database.cargoOperationalHandoff.upsert({
    where: {
      organizationId_handoffReference: {
        organizationId,
        handoffReference: "HND-LOCAL-001",
      },
    },
    update: {
      cargoId: railCargo.id,
      conditionStatus: "sound",
      fromCustodyOwnerName: "CFB Operations",
      handoffAt: addHours(now, -7),
      handoffLocationName: "Terminal Ferroviario do Lobito",
      handoffNotes: "Transferencia para equipa de transporte ferroviario.",
      handoffType: "rail_to_port",
      operatorName: "Operador Ferroviario Local",
      sealReference: "SEAL-LOCAL-001",
      sourceSystem: localDemoDefaults.sourceSystem,
      toCustodyOwnerName: "Rail Ops",
      trackingShipmentId: railShipment.id,
    },
    create: {
      id: "local_demo_cargo_handoff_001",
      organizationId,
      cargoId: railCargo.id,
      conditionStatus: "sound",
      fromCustodyOwnerName: "CFB Operations",
      handoffAt: addHours(now, -7),
      handoffLocationName: "Terminal Ferroviario do Lobito",
      handoffNotes: "Transferencia para equipa de transporte ferroviario.",
      handoffReference: "HND-LOCAL-001",
      handoffType: "rail_to_port",
      operatorName: "Operador Ferroviario Local",
      recordIdempotencyKey: "local-demo-handoff-record-001",
      sealReference: "SEAL-LOCAL-001",
      sourceSystem: localDemoDefaults.sourceSystem,
      toCustodyOwnerName: "Rail Ops",
      trackingShipmentId: railShipment.id,
    },
  });
  const deliveryException = await database.cargoDeliveryException.upsert({
    where: {
      organizationId_recordIdempotencyKey: {
        organizationId,
        recordIdempotencyKey: "local-demo-delivery-exception-record-003",
      },
    },
    update: {
      cargoId: deliveredCargo.id,
      claimReference: "CLAIM-LOCAL-003",
      deliveryConditionStatus: "damaged",
      evidenceReference: "EVID-DAMAGE-LOCAL-003",
      exceptionSummary: "Avaria menor em embalagem externa, claim aceite.",
      exceptionType: "damage",
      occurredAt: addHours(now, -17),
      reportedByName: "Cliente Final Demo",
      resolvedAt: addHours(now, -15),
      resolutionCode: "claim_accepted",
      resolutionReference: "RES-CLAIM-LOCAL-003",
      resolutionSummary: "Claim aceite e liquidado sem impacto no tracking final.",
      resolverName: "SAPTM Local Admin",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "resolved",
      trackingShipmentId: portShipment.id,
    },
    create: {
      id: "local_demo_delivery_exception_003",
      organizationId,
      cargoId: deliveredCargo.id,
      claimReference: "CLAIM-LOCAL-003",
      deliveryConditionStatus: "damaged",
      evidenceReference: "EVID-DAMAGE-LOCAL-003",
      exceptionSummary: "Avaria menor em embalagem externa, claim aceite.",
      exceptionType: "damage",
      occurredAt: addHours(now, -17),
      recordIdempotencyKey: "local-demo-delivery-exception-record-003",
      reportedByName: "Cliente Final Demo",
      resolveIdempotencyKey: "local-demo-delivery-exception-resolve-003",
      resolvedAt: addHours(now, -15),
      resolutionCode: "claim_accepted",
      resolutionReference: "RES-CLAIM-LOCAL-003",
      resolutionSummary: "Claim aceite e liquidado sem impacto no tracking final.",
      resolverName: "SAPTM Local Admin",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "resolved",
      trackingShipmentId: portShipment.id,
    },
  });

  await database.cargoClaimSettlement.upsert({
    where: {
      organizationId_settlementReference: {
        organizationId,
        settlementReference: "SETTLE-LOCAL-003",
      },
    },
    update: {
      cargoId: deliveredCargo.id,
      claimReference: "CLAIM-LOCAL-003",
      counterpartyName: "Transportador Demo",
      currencyCode: "USD",
      deliveryExceptionId: deliveryException.id,
      settledAt: addHours(now, -14),
      settledByName: "SAPTM Local Admin",
      settlementAmount: "125.00",
      settlementStatus: "settled",
      settlementSummary: "Credito operacional aplicado ao cliente final.",
      settlementType: "customer_credit",
      sourceSystem: localDemoDefaults.sourceSystem,
    },
    create: {
      id: "local_demo_claim_settlement_003",
      organizationId,
      cargoId: deliveredCargo.id,
      claimReference: "CLAIM-LOCAL-003",
      counterpartyName: "Transportador Demo",
      currencyCode: "USD",
      deliveryExceptionId: deliveryException.id,
      recordIdempotencyKey: "local-demo-claim-settlement-record-003",
      settledAt: addHours(now, -14),
      settledByName: "SAPTM Local Admin",
      settlementAmount: "125.00",
      settlementReference: "SETTLE-LOCAL-003",
      settlementStatus: "settled",
      settlementSummary: "Credito operacional aplicado ao cliente final.",
      settlementType: "customer_credit",
      sourceSystem: localDemoDefaults.sourceSystem,
    },
  });
}

async function seedReleaseEvidenceEvents(
  database: PrismaClient,
  organizationId: string,
  now: Date,
) {
  await database.auditRecord.upsert({
    where: {
      id: "local_demo_audit_seed_dataset_ready",
    },
    update: {
      after: {
        modules: ["tracking", "cargo", "capacity", "tariff"],
        p0LocalQa: "authenticated-demo-dataset",
      },
      correlationId: "local-demo-seed",
      createdAt: addMinutes(now, -5),
    },
    create: {
      id: "local_demo_audit_seed_dataset_ready",
      organizationId,
      action: "local.demo.seeded",
      actorId: "local-demo-seed",
      actorType: "platform",
      after: {
        modules: ["tracking", "cargo", "capacity", "tariff"],
        p0LocalQa: "authenticated-demo-dataset",
      },
      correlationId: "local-demo-seed",
      createdAt: addMinutes(now, -5),
      severity: "low",
      subjectId: organizationId,
      subjectType: "organization",
    },
  });
  await database.outboxEvent.upsert({
    where: {
      id: "local_demo_outbox_seed_dataset_ready",
    },
    update: {
      aggregateId: organizationId,
      availableAt: addMinutes(now, -5),
      payload: {
        modules: ["tracking", "cargo", "capacity", "tariff"],
        source: localDemoDefaults.sourceSystem,
      },
      status: "pending",
    },
    create: {
      id: "local_demo_outbox_seed_dataset_ready",
      organizationId,
      aggregateId: organizationId,
      aggregateType: "organization",
      availableAt: addMinutes(now, -5),
      eventType: "local.demo.seeded",
      payload: {
        modules: ["tracking", "cargo", "capacity", "tariff"],
        source: localDemoDefaults.sourceSystem,
      },
      status: "pending",
    },
  });
}

async function upsertReadyCargo(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    cargoReference: string;
    cargoDescription: string;
    cargoType: "break_bulk" | "refrigerated";
    grossWeightKg: string;
    packageCount: number;
    volumeM3: string;
    now: Date;
  },
) {
  return database.cargo.upsert({
    where: {
      organizationId_cargoReference: {
        organizationId: input.organizationId,
        cargoReference: input.cargoReference,
      },
    },
    update: {
      cargoDescription: input.cargoDescription,
      cargoType: input.cargoType,
      conditionStatus: "sound",
      consigneeName: "Porto de Luanda",
      custodyOwnerName: "Capacity Ops",
      customsReference: "CUST-CLR-CAP",
      customsStatus: "cleared",
      destinationName: "Porto de Luanda",
      expectedReadyAt: addHours(input.now, 4),
      grossWeightKg: input.grossWeightKg,
      hazardous: false,
      originName: "Terminal Ferroviario do Lobito",
      packageCount: input.packageCount,
      priority: 3,
      releaseReason: "Carga preparada para reserva de capacidade.",
      releaseReference: `REL-${input.cargoReference}`,
      releasedAt: addHours(input.now, -1),
      requiresInspection: false,
      shipperName: "SAPTM Demo Shipper",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "ready_for_transport",
      volumeM3: input.volumeM3,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      cargoReference: input.cargoReference,
      cargoDescription: input.cargoDescription,
      cargoType: input.cargoType,
      conditionStatus: "sound",
      consigneeName: "Porto de Luanda",
      custodyOwnerName: "Capacity Ops",
      customsReference: "CUST-CLR-CAP",
      customsStatus: "cleared",
      destinationName: "Porto de Luanda",
      expectedReadyAt: addHours(input.now, 4),
      grossWeightKg: input.grossWeightKg,
      hazardous: false,
      originName: "Terminal Ferroviario do Lobito",
      packageCount: input.packageCount,
      priority: 3,
      registrationIdempotencyKey: `local-demo-register-${input.cargoReference.toLowerCase()}`,
      releaseIdempotencyKey: `local-demo-release-${input.cargoReference.toLowerCase()}`,
      releaseReason: "Carga preparada para reserva de capacidade.",
      releaseReference: `REL-${input.cargoReference}`,
      releasedAt: addHours(input.now, -1),
      requiresInspection: false,
      shipperName: "SAPTM Demo Shipper",
      sourceSystem: localDemoDefaults.sourceSystem,
      status: "ready_for_transport",
      volumeM3: input.volumeM3,
    },
  });
}

async function upsertTrackingEvent(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    shipmentId: string;
    eventType:
      | "arrived"
      | "created"
      | "customs_hold"
      | "departed"
      | "handover_completed"
      | "location_updated";
    occurredAt: Date;
    locationName: string;
    notes: string;
    payload: Record<string, unknown>;
  },
) {
  await database.trackingEvent.upsert({
    where: {
      id: input.id,
    },
    update: {
      eventType: input.eventType,
      locationName: input.locationName,
      notes: input.notes,
      occurredAt: input.occurredAt,
      payload: input.payload,
      shipmentId: input.shipmentId,
      sourceSystem: localDemoDefaults.sourceSystem,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      correlationId: "local-demo-seed",
      eventType: input.eventType,
      idempotencyKey: `idem-${input.id}`,
      locationName: input.locationName,
      notes: input.notes,
      occurredAt: input.occurredAt,
      payload: input.payload,
      sourceSystem: localDemoDefaults.sourceSystem,
    },
  });
}

async function upsertCapacitySlot(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    resourceId: string;
    slotReference: string;
    windowStartAt: Date;
    windowEndAt: Date;
    capacityUnits: number;
    reservedUnits: number;
    status: "open";
    idempotencyKey: string;
  },
) {
  return database.capacitySlot.upsert({
    where: {
      organizationId_slotReference: {
        organizationId: input.organizationId,
        slotReference: input.slotReference,
      },
    },
    update: {
      capacityUnits: input.capacityUnits,
      reservedUnits: input.reservedUnits,
      resourceId: input.resourceId,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
      windowEndAt: input.windowEndAt,
      windowStartAt: input.windowStartAt,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      capacityUnits: input.capacityUnits,
      recordIdempotencyKey: input.idempotencyKey,
      reservedUnits: input.reservedUnits,
      resourceId: input.resourceId,
      slotReference: input.slotReference,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
      windowEndAt: input.windowEndAt,
      windowStartAt: input.windowStartAt,
    },
  });
}

async function upsertCapacityReservation(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    cargoId: string;
    slotId: string;
    reservationReference: string;
    reservationPurpose: "departure" | "handoff" | "storage";
    status: "reserved" | "cancelled";
    reservedUnits: number;
    reservedByName: string;
    reservedAt: Date;
    cancellationReference?: string;
    cancelledByName?: string;
    cancellationReason?: string;
    cancelledAt?: Date;
    reserveIdempotencyKey: string;
    cancelIdempotencyKey?: string;
  },
) {
  await database.capacitySlotReservation.upsert({
    where: {
      organizationId_reservationReference: {
        organizationId: input.organizationId,
        reservationReference: input.reservationReference,
      },
    },
    update: {
      cancellationReason: input.cancellationReason ?? null,
      cancellationReference: input.cancellationReference ?? null,
      cancelledAt: input.cancelledAt ?? null,
      cancelledByName: input.cancelledByName ?? null,
      cargoId: input.cargoId,
      reservedAt: input.reservedAt,
      reservedByName: input.reservedByName,
      reservedUnits: input.reservedUnits,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      cancelIdempotencyKey: input.cancelIdempotencyKey,
      cancellationReason: input.cancellationReason,
      cancellationReference: input.cancellationReference,
      cancelledAt: input.cancelledAt,
      cancelledByName: input.cancelledByName,
      cargoId: input.cargoId,
      reservationPurpose: input.reservationPurpose,
      reservationReference: input.reservationReference,
      reserveIdempotencyKey: input.reserveIdempotencyKey,
      reservedAt: input.reservedAt,
      reservedByName: input.reservedByName,
      reservedUnits: input.reservedUnits,
      slotId: input.slotId,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
    },
  });
}

async function upsertTariffRateRule(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    rateCardId: string;
    ruleCode: string;
    chargeName: string;
    chargeType: "freight" | "handling";
    calculationBasis: "flat" | "per_weight_kg";
    unitRate: string | null;
    flatAmount: string | null;
    percentageRate: string | null;
    minimumCharge: string | null;
    originName: string | null;
    destinationName: string | null;
    cargoType: "container" | null;
    effectiveFrom: Date;
    effectiveUntil: Date;
    recordIdempotencyKey: string;
  },
) {
  await database.tariffRateRule.upsert({
    where: {
      organizationId_rateCardId_ruleCode: {
        organizationId: input.organizationId,
        rateCardId: input.rateCardId,
        ruleCode: input.ruleCode,
      },
    },
    update: {
      calculationBasis: input.calculationBasis,
      cargoType: input.cargoType,
      chargeName: input.chargeName,
      chargeType: input.chargeType,
      destinationName: input.destinationName,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil,
      flatAmount: input.flatAmount,
      minimumCharge: input.minimumCharge,
      originName: input.originName,
      percentageRate: input.percentageRate,
      sourceSystem: localDemoDefaults.sourceSystem,
      unitRate: input.unitRate,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      calculationBasis: input.calculationBasis,
      cargoType: input.cargoType,
      chargeName: input.chargeName,
      chargeType: input.chargeType,
      destinationName: input.destinationName,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil,
      flatAmount: input.flatAmount,
      minimumCharge: input.minimumCharge,
      originName: input.originName,
      percentageRate: input.percentageRate,
      rateCardId: input.rateCardId,
      recordIdempotencyKey: input.recordIdempotencyKey,
      ruleCode: input.ruleCode,
      sourceSystem: localDemoDefaults.sourceSystem,
      unitRate: input.unitRate,
    },
  });
}

async function upsertTariffQuote(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    cargoId: string;
    rateCardId: string;
    quoteReference: string;
    status: "approved" | "calculated";
    currencyCode: string;
    quotedAmount: string;
    calculationPayload: Record<string, unknown>;
    calculatedByName: string;
    calculatedAt: Date;
    approvedByName: string | null;
    approvalReference: string | null;
    approvalNotes: string | null;
    approvedAt: Date | null;
    calculateIdempotencyKey: string;
    approveIdempotencyKey: string | null;
  },
) {
  return database.tariffQuote.upsert({
    where: {
      organizationId_quoteReference: {
        organizationId: input.organizationId,
        quoteReference: input.quoteReference,
      },
    },
    update: {
      approvalNotes: input.approvalNotes,
      approvalReference: input.approvalReference,
      approvedAt: input.approvedAt,
      approvedByName: input.approvedByName,
      calculatedAt: input.calculatedAt,
      calculatedByName: input.calculatedByName,
      calculationPayload: input.calculationPayload,
      cargoId: input.cargoId,
      currencyCode: input.currencyCode,
      quotedAmount: input.quotedAmount,
      rateCardId: input.rateCardId,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      approvalNotes: input.approvalNotes,
      approvalReference: input.approvalReference,
      approveIdempotencyKey: input.approveIdempotencyKey,
      approvedAt: input.approvedAt,
      approvedByName: input.approvedByName,
      calculatedAt: input.calculatedAt,
      calculatedByName: input.calculatedByName,
      calculateIdempotencyKey: input.calculateIdempotencyKey,
      calculationPayload: input.calculationPayload,
      cargoId: input.cargoId,
      currencyCode: input.currencyCode,
      quotedAmount: input.quotedAmount,
      quoteReference: input.quoteReference,
      rateCardId: input.rateCardId,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
    },
  });
}

async function upsertCargoComplianceEvidence(
  database: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    cargoId: string;
    evidenceType: "hazardous_goods_declaration" | "release_authorization";
    documentReference: string;
    documentTitle: string;
    documentUri: string;
    issuerName: string;
    issuedAt: Date;
    expiresAt: Date;
    status: "approved" | "pending_review";
    reviewerName: string | null;
    reviewReference: string | null;
    reviewSummary: string | null;
    reviewedAt: Date | null;
    recordIdempotencyKey: string;
    verifyIdempotencyKey: string | null;
    recordedByActorId: string;
    reviewedByActorId: string | null;
    recordedAt: Date;
  },
) {
  await database.cargoComplianceEvidence.upsert({
    where: {
      organizationId_cargoId_evidenceType_documentReference: {
        organizationId: input.organizationId,
        cargoId: input.cargoId,
        evidenceType: input.evidenceType,
        documentReference: input.documentReference,
      },
    },
    update: {
      documentTitle: input.documentTitle,
      documentUri: input.documentUri,
      expiresAt: input.expiresAt,
      issuedAt: input.issuedAt,
      issuerName: input.issuerName,
      recordedAt: input.recordedAt,
      recordedByActorId: input.recordedByActorId,
      reviewedAt: input.reviewedAt,
      reviewedByActorId: input.reviewedByActorId,
      reviewerName: input.reviewerName,
      reviewReference: input.reviewReference,
      reviewSummary: input.reviewSummary,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
    },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      cargoId: input.cargoId,
      documentReference: input.documentReference,
      documentTitle: input.documentTitle,
      documentUri: input.documentUri,
      evidenceType: input.evidenceType,
      expiresAt: input.expiresAt,
      issuedAt: input.issuedAt,
      issuerName: input.issuerName,
      recordIdempotencyKey: input.recordIdempotencyKey,
      recordedAt: input.recordedAt,
      recordedByActorId: input.recordedByActorId,
      reviewedAt: input.reviewedAt,
      reviewedByActorId: input.reviewedByActorId,
      reviewerName: input.reviewerName,
      reviewReference: input.reviewReference,
      reviewSummary: input.reviewSummary,
      sourceSystem: localDemoDefaults.sourceSystem,
      status: input.status,
      verifyIdempotencyKey: input.verifyIdempotencyKey,
    },
  });
}

function assertDemoSeedAllowed(): void {
  if (process.env.NODE_ENV === "production" && process.env.SAPTM_SEED_DEMO_DATA !== "1") {
    throw new Error("local-demo-seed.refuses_production_without_explicit_opt_in");
  }
}

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();

  return value === undefined || value.length === 0 ? fallback : value;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}
