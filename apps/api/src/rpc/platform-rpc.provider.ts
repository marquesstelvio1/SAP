import { Inject, Injectable } from "@nestjs/common";

import { AdminService } from "../admin/admin.service.js";
import { AuditService } from "../audit/audit.service.js";
import { BillingService } from "../billing/billing.service.js";
import { PlansService } from "../billing/plans/plans.service.js";
import { CapacityService } from "../capacity/capacity.service.js";
import { CargoService } from "../cargo/cargo.service.js";
import { DocumentsService } from "../documents/documents.service.js";
import { IntegrationsService } from "../integrations/integrations.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import { OverviewService } from "../overview/overview.service.js";
import { PlanningService } from "../planning/planning.service.js";
import { PrivacyService } from "../privacy/privacy.service.js";
import { ReportsService } from "../reports/reports.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { TariffService } from "../tariff/tariff.service.js";
import { TeamsService } from "../teams/teams.service.js";
import { TrackingService } from "../tracking/tracking.service.js";
import { WebhooksService } from "../webhooks/webhooks.service.js";
import { createPlatformRpcRouter, type PlatformRpcRouter } from "./platform-rpc.router.js";
import { RpcContextService } from "./rpc-context.service.js";

@Injectable()
export class PlatformRpcProvider {
  public readonly router: PlatformRpcRouter;

  constructor(
    @Inject(AdminService)
    adminService: AdminService,
    @Inject(AuditService)
    auditService: AuditService,
    @Inject(BillingService)
    billingService: BillingService,
    @Inject(PlansService)
    plansService: PlansService,
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
    @Inject(OverviewService)
    overviewService: OverviewService,
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
    this.router = createPlatformRpcRouter({
      adminService,
      auditService,
      billingService,
      plansService,
      cargoService,
      trackingService,
      capacityService,
      documentsService,
      integrationsService,
      notificationsService,
      organizationsService,
      overviewService,
      planningService,
      reportsService,
      settingsService,
      tariffService,
      teamsService,
      webhooksService,
      privacyService,
      rpcContextService,
    });
  }
}
