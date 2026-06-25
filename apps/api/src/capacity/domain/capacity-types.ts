export type TransportMode = "road" | "rail" | "sea" | "air";

export type CapacitySlotStatus = "scheduled" | "in_transit" | "completed" | "cancelled";

export interface CapacitySlot {
  id: string;
  tenantId: string;
  origin: string;
  destination: string;
  transportMode: TransportMode;
  availableWeight: number;
  availableVolume: number;
  totalWeight: number;
  totalVolume: number;
  departureDate: Date;
  arrivalDate: Date;
  status: CapacitySlotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacityAllocation {
  id: string;
  tenantId: string;
  slotId: string;
  cargoId: string;
  allocatedWeight: number;
  allocatedVolume: number;
  priority: number;
  status: "proposed" | "confirmed" | "released" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export type CapacitySlotOverview = {
  slot: CapacitySlot;
  allocatedWeight: number;
  allocatedVolume: number;
  utilizationPercent: number;
};
