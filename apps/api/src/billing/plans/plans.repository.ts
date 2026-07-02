export const PLANS_REPOSITORY = Symbol("PlansRepository");

export type PlanRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: unknown;
  limits: unknown;
  isPublic: boolean;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export interface PlansRepository {
  findAll(options?: { includeInternal?: boolean }): Promise<PlanRecord[]>;
  findBySlug(slug: string): Promise<PlanRecord | null>;
  findActivePublicPlans(): Promise<PlanRecord[]>;
}
