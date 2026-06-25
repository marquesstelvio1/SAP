export const WEBHOOKS_REPOSITORY = Symbol("WebhooksRepository");

export type WebhookEndpointRecord = {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WebhookDeliveryRecord = {
  id: string;
  webhookId: string;
  eventType: string;
  status: string;
  statusCode: number | null;
  responseBody: string | null;
  attemptCount: number;
  nextRetryAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
};

export type ActiveEndpointRecord = {
  id: string;
  url: string;
  secret: string | null;
};

export type CreateWebhookDeliveryInput = {
  webhookId: string;
  eventType: string;
  payload: unknown;
  status: string;
  statusCode: number | null;
  responseBody: string | null;
  attemptCount: number;
  deliveredAt: Date | null;
  nextRetryAt: Date | null;
};

export type UpdateWebhookData = {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
};

export type CreateWebhookData = {
  organizationId: string;
  name: string;
  url: string;
  events: string[];
};

export interface WebhooksRepository {
  createWebhook(data: CreateWebhookData): Promise<WebhookEndpointRecord>;
  findWebhookByIdAndOrg(
    webhookId: string,
    organizationId: string,
  ): Promise<WebhookEndpointRecord | null>;
  updateWebhook(webhookId: string, data: UpdateWebhookData): Promise<WebhookEndpointRecord>;
  deleteWebhook(webhookId: string): Promise<void>;
  listWebhooks(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<[WebhookEndpointRecord[], number]>;

  listWebhookDeliveries(
    webhookId: string,
    limit: number,
    offset: number,
  ): Promise<[WebhookDeliveryRecord[], number]>;

  findActiveEndpointsByEvent(
    organizationId: string,
    eventType: string,
  ): Promise<ActiveEndpointRecord[]>;
  createWebhookDelivery(data: CreateWebhookDeliveryInput): Promise<void>;
  updateEndpointSuccess(webhookId: string): Promise<void>;
  updateEndpointFailure(webhookId: string): Promise<void>;
}
