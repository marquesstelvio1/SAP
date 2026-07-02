export const BILLING_REPOSITORY = Symbol("BillingRepository");

export type OrganizationWithSubscription = {
  id: string;
  name: string;
  subscription: { stripeCustomerId: string | null } | null;
  memberships: { user: { email: string } }[];
};

export type SubscriptionRecord = {
  id: string;
  organizationId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceRecord = {
  id: string;
  organizationId: string;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  paidAt: Date | null;
  downloadUrl: string | null;
  createdAt: Date;
};

export type UsageRecordRecord = {
  id: string;
  organizationId: string;
  metric: string;
  current: number;
  limit: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionUpsertInput = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
};

export type InvoiceCreateInput = {
  organizationId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  paidAt: Date | null;
  downloadUrl: string | null;
};

export type UsageRecordCreateInput = {
  organizationId: string;
  metric: string;
  current: number;
  limit: number;
  periodStart: Date;
  periodEnd: Date;
};

export type UsageRecordUpsertUpdateInput = {
  limit: number;
};

export interface BillingRepository {
  findOrganizationWithDetails(organizationId: string): Promise<OrganizationWithSubscription | null>;

  findSubscription(organizationId: string): Promise<SubscriptionRecord | null>;
  findSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<{ organizationId: string } | null>;
  upsertSubscription(organizationId: string, data: SubscriptionUpsertInput): Promise<void>;
  updateSubscriptionStatus(organizationId: string, status: string): Promise<void>;

  findInvoices(organizationId: string, limit: number, offset?: number): Promise<InvoiceRecord[]>;
  countInvoices(organizationId: string): Promise<number>;
  createInvoice(data: InvoiceCreateInput): Promise<void>;

  findUsageRecords(organizationId: string): Promise<UsageRecordRecord[]>;
  findUsageRecord(organizationId: string, metric: string): Promise<UsageRecordRecord | null>;
  createUsageRecord(data: UsageRecordCreateInput): Promise<void>;
  incrementUsageRecord(organizationId: string, metric: string, delta: number): Promise<void>;
  resetExpiredUsageRecords(): Promise<void>;
  upsertUsageRecord(organizationId: string, metric: string, limit: number): Promise<void>;
}
