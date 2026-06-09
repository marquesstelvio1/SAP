import { os } from "@orpc/server";
import {
  createFoundationRpcHealthReport,
  foundationRpcHealthMetadata,
  foundationRpcHealthOutputSchema,
} from "@saptm/rpc";

import { type AdminRpcContext, createAdminRpcRouter } from "../admin/admin-rpc.router.js";
import { type AuditRpcContext, createAuditRpcRouter } from "../audit/audit-rpc.router.js";
import {
  type CapacityRpcContext,
  createCapacityRpcRouter,
} from "../capacity/capacity-rpc.router.js";
import { type CargoRpcContext, createCargoRpcRouter } from "../cargo/cargo-rpc.router.js";
import {
  createIntegrationsRpcRouter,
  type IntegrationsRpcContext,
} from "../integrations/integrations-rpc.router.js";
import {
  createNotificationsRpcRouter,
  type NotificationsRpcContext,
} from "../notifications/notifications-rpc.router.js";
import {
  createPlanningRpcRouter,
  type PlanningRpcContext,
} from "../planning/planning-rpc.router.js";
import { createReportsRpcRouter, type ReportsRpcContext } from "../reports/reports-rpc.router.js";
import { createTariffRpcRouter, type TariffRpcContext } from "../tariff/tariff-rpc.router.js";
import {
  createTrackingRpcRouter,
  type TrackingRpcContext,
} from "../tracking/tracking-rpc.router.js";

export type PlatformRpcContext = AdminRpcContext &
  AuditRpcContext &
  CapacityRpcContext &
  CargoRpcContext &
  IntegrationsRpcContext &
  NotificationsRpcContext &
  PlanningRpcContext &
  ReportsRpcContext &
  TariffRpcContext &
  TrackingRpcContext;

export type CreatePlatformRpcRouterInput = Parameters<typeof createAdminRpcRouter>[0] &
  Parameters<typeof createAuditRpcRouter>[0] &
  Parameters<typeof createCargoRpcRouter>[0] &
  Parameters<typeof createCapacityRpcRouter>[0] &
  Parameters<typeof createIntegrationsRpcRouter>[0] &
  Parameters<typeof createNotificationsRpcRouter>[0] &
  Parameters<typeof createPlanningRpcRouter>[0] &
  Parameters<typeof createReportsRpcRouter>[0] &
  Parameters<typeof createTariffRpcRouter>[0] &
  Parameters<typeof createTrackingRpcRouter>[0];

export function createPlatformRpcRouter(input: CreatePlatformRpcRouterInput) {
  const platformRpc = os.$context<PlatformRpcContext>();
  const adminRpcRouter = createAdminRpcRouter(input);
  const auditRpcRouter = createAuditRpcRouter(input);
  const capacityRpcRouter = createCapacityRpcRouter(input);
  const cargoRpcRouter = createCargoRpcRouter(input);
  const integrationsRpcRouter = createIntegrationsRpcRouter(input);
  const notificationsRpcRouter = createNotificationsRpcRouter(input);
  const planningRpcRouter = createPlanningRpcRouter(input);
  const reportsRpcRouter = createReportsRpcRouter(input);
  const tariffRpcRouter = createTariffRpcRouter(input);
  const trackingRpcRouter = createTrackingRpcRouter(input);

  return platformRpc.router({
    system: {
      health: platformRpc
        .meta(foundationRpcHealthMetadata)
        .route({ method: "GET", path: "/system/health" })
        .output(foundationRpcHealthOutputSchema)
        .handler(() => createFoundationRpcHealthReport()),
    },
    capacity: capacityRpcRouter.capacity,
    cargo: cargoRpcRouter.cargo,
    admin: adminRpcRouter.admin,
    audit: auditRpcRouter.audit,
    integrations: integrationsRpcRouter.integrations,
    notifications: notificationsRpcRouter.notifications,
    planning: planningRpcRouter.planning,
    reports: reportsRpcRouter.reports,
    tariff: tariffRpcRouter.tariff,
    tracking: trackingRpcRouter.tracking,
  });
}

export type PlatformRpcRouter = ReturnType<typeof createPlatformRpcRouter>;
