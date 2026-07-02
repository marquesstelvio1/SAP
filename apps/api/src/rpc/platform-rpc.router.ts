import { os } from "@orpc/server";
import {
  createFoundationRpcHealthReport,
  foundationRpcHealthMetadata,
  foundationRpcHealthOutputSchema,
} from "@saptm/rpc";

import { type AdminRpcContext, createAdminRpcRouter } from "../admin/admin-rpc.router.js";
import { type AuditRpcContext, createAuditRpcRouter } from "../audit/audit-rpc.router.js";
import { type BillingRpcContext, createBillingRpcRouter } from "../billing/billing-rpc.router.js";
import { createPlansRpcRouter, type PlansRpcContext } from "../billing/plans/plans-rpc.router.js";
import {
  type CapacityRpcContext,
  createCapacityRpcRouter,
} from "../capacity/capacity-rpc.router.js";
import { type CargoRpcContext, createCargoRpcRouter } from "../cargo/cargo-rpc.router.js";
import {
  createDocumentsRpcRouter,
  type DocumentsRpcContext,
} from "../documents/documents-rpc.router.js";
import {
  createIntegrationsRpcRouter,
  type IntegrationsRpcContext,
} from "../integrations/integrations-rpc.router.js";
import {
  createNotificationsRpcRouter,
  type NotificationsRpcContext,
} from "../notifications/notifications-rpc.router.js";
import {
  createOrganizationsRpcRouter,
  type OrganizationsRpcContext,
} from "../organizations/organizations-rpc.router.js";
import type { OverviewService } from "../overview/overview.service.js";
import {
  createPlanningRpcRouter,
  type PlanningRpcContext,
} from "../planning/planning-rpc.router.js";
import { createPrivacyRpcRouter, type PrivacyRpcContext } from "../privacy/privacy-rpc.router.js";
import { createReportsRpcRouter, type ReportsRpcContext } from "../reports/reports-rpc.router.js";
import {
  createSettingsRpcRouter,
  type SettingsRpcContext,
} from "../settings/settings-rpc.router.js";
import { createTariffRpcRouter, type TariffRpcContext } from "../tariff/tariff-rpc.router.js";
import { createSsoRpcRouter, type SsoRpcContext } from "../sso/sso-rpc.router.js";
import { createTeamsRpcRouter, type TeamsRpcContext } from "../teams/teams-rpc.router.js";
import {
  createTrackingRpcRouter,
  type TrackingRpcContext,
} from "../tracking/tracking-rpc.router.js";
import {
  createWebhooksRpcRouter,
  type WebhooksRpcContext,
} from "../webhooks/webhooks-rpc.router.js";

export type PlatformRpcContext = AdminRpcContext &
  AuditRpcContext &
  BillingRpcContext &
  CapacityRpcContext &
  CargoRpcContext &
  DocumentsRpcContext &
  IntegrationsRpcContext &
  NotificationsRpcContext &
  OrganizationsRpcContext &
  PlansRpcContext &
  PlanningRpcContext &
  ReportsRpcContext &
  SettingsRpcContext &
  SsoRpcContext &
  TariffRpcContext &
  TeamsRpcContext &
  TrackingRpcContext &
  WebhooksRpcContext &
  PrivacyRpcContext;

export type CreatePlatformRpcRouterInput = Parameters<typeof createAdminRpcRouter>[0] &
  Parameters<typeof createAuditRpcRouter>[0] &
  Parameters<typeof createBillingRpcRouter>[0] &
  Parameters<typeof createCargoRpcRouter>[0] &
  Parameters<typeof createCapacityRpcRouter>[0] &
  Parameters<typeof createDocumentsRpcRouter>[0] &
  Parameters<typeof createIntegrationsRpcRouter>[0] &
  Parameters<typeof createNotificationsRpcRouter>[0] &
  Parameters<typeof createOrganizationsRpcRouter>[0] &
  Parameters<typeof createPlansRpcRouter>[0] &
  Parameters<typeof createPlanningRpcRouter>[0] &
  Parameters<typeof createReportsRpcRouter>[0] &
  Parameters<typeof createSettingsRpcRouter>[0] &
  Parameters<typeof createSsoRpcRouter>[0] &
  Parameters<typeof createTariffRpcRouter>[0] &
  Parameters<typeof createTrackingRpcRouter>[0] &
  Parameters<typeof createTeamsRpcRouter>[0] &
  Parameters<typeof createWebhooksRpcRouter>[0] &
  Parameters<typeof createPrivacyRpcRouter>[0] & {
    overviewService: Pick<
      OverviewService,
      | "getComplianceOverview"
      | "getDeliveryOverview"
      | "getDispatchOverview"
      | "getExceptionOverview"
    >;
  };

export function createPlatformRpcRouter(input: CreatePlatformRpcRouterInput) {
  const platformRpc = os.$context<PlatformRpcContext>();
  const adminRpcRouter = createAdminRpcRouter(input);
  const auditRpcRouter = createAuditRpcRouter(input);
  const billingRpcRouter = createBillingRpcRouter(input);
  const plansRpcRouter = createPlansRpcRouter(input);
  const capacityRpcRouter = createCapacityRpcRouter(input);
  const cargoRpcRouter = createCargoRpcRouter(input);
  const documentsRpcRouter = createDocumentsRpcRouter(input);
  const integrationsRpcRouter = createIntegrationsRpcRouter(input);
  const notificationsRpcRouter = createNotificationsRpcRouter(input);
  const organizationsRpcRouter = createOrganizationsRpcRouter(input);
  const planningRpcRouter = createPlanningRpcRouter(input);
  const reportsRpcRouter = createReportsRpcRouter(input);
  const settingsRpcRouter = createSettingsRpcRouter(input);
  const tariffRpcRouter = createTariffRpcRouter(input);
  const trackingRpcRouter = createTrackingRpcRouter(input);
  const ssoRpcRouter = createSsoRpcRouter(input);
  const teamsRpcRouter = createTeamsRpcRouter(input);
  const webhooksRpcRouter = createWebhooksRpcRouter(input);
  const privacyRpcRouter = createPrivacyRpcRouter(input);

  return platformRpc.router({
    system: {
      health: platformRpc
        .meta(foundationRpcHealthMetadata)
        .route({ method: "GET", path: "/system/health" })
        .output(foundationRpcHealthOutputSchema)
        .handler(() => createFoundationRpcHealthReport()),
    },
    billing: billingRpcRouter.billing,
    plans: plansRpcRouter.plans,
    capacity: capacityRpcRouter.capacity,
    cargo: cargoRpcRouter.cargo,
    documents: documentsRpcRouter.documents,
    admin: adminRpcRouter.admin,
    audit: auditRpcRouter.audit,
    integrations: integrationsRpcRouter.integrations,
    notifications: notificationsRpcRouter.notifications,
    organizations: organizationsRpcRouter.organizations,
    planning: planningRpcRouter.planning,
    reports: reportsRpcRouter.reports,
    settings: settingsRpcRouter.settings,
    tariff: tariffRpcRouter.tariff,
    sso: ssoRpcRouter.sso,
    teams: teamsRpcRouter.teams,
    tracking: trackingRpcRouter.tracking,
    webhooks: webhooksRpcRouter.webhooks,
    privacy: privacyRpcRouter.privacy,
  });
}

export type PlatformRpcRouter = ReturnType<typeof createPlatformRpcRouter>;
