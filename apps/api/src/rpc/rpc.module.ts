import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import { AdminModule } from "../admin/admin.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { CapacityModule } from "../capacity/capacity.module.js";
import { CargoModule } from "../cargo/cargo.module.js";
import { DocumentsModule } from "../documents/documents.module.js";
import { IntegrationsModule } from "../integrations/integrations.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { ObservabilityModule } from "../observability/observability.module.js";
import { OrganizationsModule } from "../organizations/organizations.module.js";
import { OverviewModule } from "../overview/overview.module.js";
import { PlanningModule } from "../planning/planning.module.js";
import { PrivacyModule } from "../privacy/privacy.module.js";
import { ReportsModule } from "../reports/reports.module.js";
import { SettingsModule } from "../settings/settings.module.js";
import { TariffModule } from "../tariff/tariff.module.js";
import { TeamsModule } from "../teams/teams.module.js";
import { TrackingModule } from "../tracking/tracking.module.js";
import { WebhooksModule } from "../webhooks/webhooks.module.js";
import { RpcContextService } from "./rpc-context.service.js";
import { RpcHttpMiddleware } from "./rpc-http.middleware.js";

@Module({
  imports: [
    AuthModule,
    AdminModule,
    AuditModule,
    BillingModule,
    IntegrationsModule,
    ObservabilityModule,
    CargoModule,
    DocumentsModule,
    TrackingModule,
    CapacityModule,
    PlanningModule,
    NotificationsModule,
    OrganizationsModule,
    OverviewModule,
    ReportsModule,
    SettingsModule,
    TariffModule,
    TeamsModule,
    WebhooksModule,
    PrivacyModule,
  ],
  providers: [RpcContextService, RpcHttpMiddleware],
  exports: [RpcContextService],
})
export class RpcModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RpcHttpMiddleware).forRoutes("*");
  }
}
