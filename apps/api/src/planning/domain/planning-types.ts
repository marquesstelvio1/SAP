export type PlanningSessionStatus = "draft" | "active" | "locked" | "archived";

export type PlanningAllocationStatus = "proposed" | "confirmed" | "cancelled";

export interface PlanningSession {
  id: string;
  tenantId: string;
  name: string;
  status: PlanningSessionStatus;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanningAllocation {
  id: string;
  sessionId: string;
  cargoId: string;
  capacitySlotId: string;
  priority: number;
  status: PlanningAllocationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanningConstraint {
  id: string;
  sessionId: string;
  constraintType: "weight_limit" | "volume_limit" | "exclusion_window" | "mandatory_cargo";
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PlanningSessionOverview = {
  session: PlanningSession;
  allocationCount: number;
  totalCargoWeight: number;
  totalCargoVolume: number;
};
