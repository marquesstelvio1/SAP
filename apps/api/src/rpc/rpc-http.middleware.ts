import type { IncomingMessage, ServerResponse } from "node:http";
import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";
import { RPCHandler } from "@orpc/server/node";

import { AdminService } from "../admin/admin.service.js";
import { AuditService } from "../audit/audit.service.js";
import { PrivacyService } from "../privacy/privacy.service.js";
import { BillingService } from "../billing/billing.service.js";
import { CapacityService } from "../capacity/capacity.service.js";
import { CargoService } from "../cargo/cargo.service.js";
import { DocumentsService } from "../documents/documents.service.js";
import { IntegrationsService } from "../integrations/integrations.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import { PlanningService } from "../planning/planning.service.js";
import { ReportsService } from "../reports/reports.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { TariffService } from "../tariff/tariff.service.js";
import { TeamsService } from "../teams/teams.service.js";
import { TrackingService } from "../tracking/tracking.service.js";
import { WebhooksService } from "../webhooks/webhooks.service.js";
import { createPlatformRpcRouter, type PlatformRpcContext } from "./platform-rpc.router.js";
import type { RpcRequestWithAuthContext } from "./rpc-context.js";
import { RpcContextService } from "./rpc-context.service.js";

@Injectable()
export class RpcHttpMiddleware implements NestMiddleware {
  private readonly handler: RPCHandler<PlatformRpcContext>;

  constructor(
    @Inject(AdminService)
    adminService: AdminService,
    @Inject(AuditService)
    auditService: AuditService,
    @Inject(BillingService)
    billingService: BillingService,
    @Inject(CargoService)
    cargoService: CargoService,
    @Inject(TrackingService)
    trackingService: TrackingService,
    @Inject(CapacityService)
    capacityService: CapacityService,
    @Inject(DocumentsService)
    documentsService: DocumentsService,
    @Inject(IntegrationsService)
    integrationsService: IntegrationsService,
    @Inject(NotificationsService)
    notificationsService: NotificationsService,
    @Inject(OrganizationsService)
    organizationsService: OrganizationsService,
    @Inject(PlanningService)
    planningService: PlanningService,
    @Inject(ReportsService)
    reportsService: ReportsService,
    @Inject(SettingsService)
    settingsService: SettingsService,
    @Inject(TariffService)
    tariffService: TariffService,
    @Inject(TeamsService)
    teamsService: TeamsService,
    @Inject(WebhooksService)
    webhooksService: WebhooksService,
    @Inject(PrivacyService)
    privacyService: PrivacyService,
    @Inject(RpcContextService)
    rpcContextService: RpcContextService,
  ) {
    this.handler = new RPCHandler(
      createPlatformRpcRouter({
        adminService,
        auditService,
        billingService,
        cargoService,
        trackingService,
        capacityService,
        documentsService,
        integrationsService,
        notificationsService,
        organizationsService,
        planningService,
        reportsService,
        settingsService,
        tariffService,
        teamsService,
        webhooksService,
        privacyService,
        rpcContextService,
      }),
    );
  }

  async use(
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ): Promise<void> {
    try {
      const prefixes = ["/v1/rpc", "/rpc"] as const;

      for (const prefix of prefixes) {
        const result = await this.handler.handle(request, response, {
          prefix,
          context: {
            request: request as IncomingMessage & RpcRequestWithAuthContext,
          },
        });

        if (result.matched) {
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
