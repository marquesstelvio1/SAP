import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cargoOverviewInputSchema,
  cargoSummarySchema,
  trackingOverviewInputSchema,
  trackingRecentShipmentSchema,
  trackingShipmentDetailOutputSchema,
  trackingTeamSummarySchema,
} from "../../../packages/rpc/dist/index.js";

// ──────────────────────────────────────────────
// Work Stream C: Team Scoping Tests
// ──────────────────────────────────────────────

describe("Team scoping — cargo schemas", () => {
  it("cargoOverviewInputSchema accepts teamId filter", () => {
    const input = cargoOverviewInputSchema.parse({
      teamId: "team_rail_ops",
    });

    assert.equal(input.teamId, "team_rail_ops");
  });

  it("cargoOverviewInputSchema defaults when no teamId provided", () => {
    const input = cargoOverviewInputSchema.parse({});

    assert.equal(input.teamId, undefined);
    assert.equal(input.limit, 10);
    assert.equal(input.offset, 0);
  });

  it("cargoOverviewInputSchema works with nullish default", () => {
    const input = cargoOverviewInputSchema.parse(undefined);
    assert.equal(input.teamId, undefined);
    assert.equal(input.limit, 10);
  });

  it("cargoSummarySchema includes team and teamId fields", () => {
    const summary = cargoSummarySchema.parse({
      id: "cargo_001",
      cargoReference: "CGO-2026-0001",
      teamId: "team_rail_ops",
      team: { id: "team_rail_ops", name: "Rail Operations" },
      externalReference: null,
      cargoDescription: "Containerized spare parts",
      cargoType: "container",
      status: "registered",
      customsStatus: "not_required",
      conditionStatus: "sound",
      grossWeightKg: 1200,
      packageCount: 12,
      hazardous: false,
      requiresInspection: false,
      originName: "Rail Yard A",
      destinationName: "Port Terminal B",
      custodyOwnerName: "Operations Desk",
      priority: 3,
      expectedReadyAt: null,
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    });

    assert.equal(summary.teamId, "team_rail_ops");
    assert.equal(summary.team.id, "team_rail_ops");
    assert.equal(summary.team.name, "Rail Operations");
  });

  it("cargoSummarySchema accepts null team fields", () => {
    const summary = cargoSummarySchema.parse({
      id: "cargo_002",
      cargoReference: "CGO-2026-0002",
      teamId: null,
      team: null,
      externalReference: null,
      cargoDescription: "Bulk grain",
      cargoType: "bulk",
      status: "in_transport",
      customsStatus: "cleared",
      conditionStatus: "sound",
      grossWeightKg: 50000,
      packageCount: 1,
      hazardous: false,
      requiresInspection: false,
      originName: "Rail Yard B",
      destinationName: "Port Terminal C",
      custodyOwnerName: "Bulk Ops",
      priority: 2,
      expectedReadyAt: null,
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    });

    assert.equal(summary.teamId, null);
    assert.equal(summary.team, null);
  });

  it("cargoSummarySchema accepts undefined team fields (optional)", () => {
    const summary = cargoSummarySchema.parse({
      id: "cargo_003",
      cargoReference: "CGO-2026-0003",
      externalReference: null,
      cargoDescription: "Standard container",
      cargoType: "container",
      status: "delivered",
      customsStatus: "cleared",
      conditionStatus: "sound",
      grossWeightKg: 2000,
      packageCount: 1,
      hazardous: false,
      requiresInspection: false,
      originName: "Yard A",
      destinationName: "Terminal B",
      custodyOwnerName: "Ops",
      priority: 3,
      expectedReadyAt: null,
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    });

    assert.equal(summary.teamId, undefined);
    assert.equal(summary.team, undefined);
  });
});

describe("Team scoping — tracking schemas", () => {
  it("trackingOverviewInputSchema accepts teamId filter", () => {
    const input = trackingOverviewInputSchema.parse({
      teamId: "team_port_ops",
    });

    assert.equal(input.teamId, "team_port_ops");
  });

  it("trackingOverviewInputSchema defaults when no teamId provided", () => {
    const input = trackingOverviewInputSchema.parse({});

    assert.equal(input.teamId, undefined);
    assert.equal(input.limit, 10);
    assert.equal(input.offset, 0);
  });

  it("trackingRecentShipmentSchema includes team and teamId", () => {
    const shipment = trackingRecentShipmentSchema.parse({
      id: "ship_001",
      referenceCode: "TRK-2026-0001",
      externalReference: null,
      cargoDescription: "Containerized goods",
      originName: "Rail Yard A",
      destinationName: "Port Terminal B",
      transportMode: "rail",
      status: "in_transit",
      priority: 3,
      teamId: "team_rail_ops",
      team: { id: "team_rail_ops", name: "Rail Operations" },
      estimatedArrivalAt: "2026-06-10T00:00:00.000Z",
      lastEventAt: "2026-06-04T10:00:00.000Z",
      lastEventType: "departed",
      lastKnownLocation: "Rail Yard A",
    });

    assert.equal(shipment.teamId, "team_rail_ops");
    assert.equal(shipment.team.name, "Rail Operations");
  });

  it("trackingRecentShipmentSchema accepts null team fields", () => {
    const shipment = trackingRecentShipmentSchema.parse({
      id: "ship_002",
      referenceCode: "TRK-2026-0002",
      externalReference: null,
      cargoDescription: "Bulk cargo",
      originName: "Yard B",
      destinationName: "Port C",
      transportMode: "port",
      status: "planned",
      priority: 2,
      teamId: null,
      team: null,
      estimatedArrivalAt: null,
      lastEventAt: null,
      lastEventType: null,
      lastKnownLocation: null,
    });

    assert.equal(shipment.teamId, null);
    assert.equal(shipment.team, null);
  });

  it("trackingShipmentDetailOutputSchema includes team in shipment", () => {
    const detail = trackingShipmentDetailOutputSchema.parse({
      generatedAt: "2026-06-04T00:00:00.000Z",
      organizationId: "org_port_rail",
      shipment: {
        id: "ship_001",
        referenceCode: "TRK-2026-0001",
        externalReference: null,
        cargoDescription: "Containerized goods",
        originName: "Rail Yard A",
        destinationName: "Port Terminal B",
        transportMode: "rail",
        status: "in_transit",
        priority: 3,
        teamId: "team_rail_ops",
        team: { id: "team_rail_ops", name: "Rail Operations" },
        plannedDepartureAt: "2026-06-04T08:00:00.000Z",
        estimatedArrivalAt: "2026-06-10T00:00:00.000Z",
        actualArrivalAt: null,
        createdAt: "2026-06-04T00:00:00.000Z",
        updatedAt: "2026-06-04T00:00:00.000Z",
        lastEventAt: "2026-06-04T10:00:00.000Z",
        lastEventType: "departed",
        lastKnownLocation: "Rail Yard A",
        eventCount: 2,
      },
      timeline: [],
    });

    assert.equal(detail.shipment.teamId, "team_rail_ops");
    assert.equal(detail.shipment.team.name, "Rail Operations");
  });

  it("trackingShipmentDetailOutputSchema accepts null team", () => {
    const detail = trackingShipmentDetailOutputSchema.parse({
      generatedAt: "2026-06-04T00:00:00.000Z",
      organizationId: "org_port_rail",
      shipment: {
        id: "ship_002",
        referenceCode: "TRK-2026-0002",
        externalReference: null,
        cargoDescription: "Bulk cargo",
        originName: "Yard B",
        destinationName: "Port C",
        transportMode: "road",
        status: "arrived",
        priority: 1,
        teamId: null,
        team: null,
        plannedDepartureAt: null,
        estimatedArrivalAt: null,
        actualArrivalAt: "2026-06-05T00:00:00.000Z",
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        lastEventAt: "2026-06-05T00:00:00.000Z",
        lastEventType: "arrived",
        lastKnownLocation: "Port C",
        eventCount: 5,
      },
      timeline: [],
    });

    assert.equal(detail.shipment.teamId, null);
    assert.equal(detail.shipment.team, null);
  });
});

describe("Team scoping — trackingTeamSummarySchema", () => {
  it("validates correct team summary structure", () => {
    const team = trackingTeamSummarySchema.parse({
      id: "team_rail_ops",
      name: "Rail Operations",
    });

    assert.equal(team.id, "team_rail_ops");
    assert.equal(team.name, "Rail Operations");
  });

  it("rejects team summary without name", () => {
    assert.throws(() => {
      trackingTeamSummarySchema.parse({ id: "team_001" });
    }, /Invalid input/);
  });
});
