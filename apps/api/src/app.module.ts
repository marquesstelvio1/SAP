import { Module, type OnApplicationShutdown } from "@nestjs/common";
import { getPrismaClient } from "@saptm/database";
import { AdminModule } from "./admin/admin.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { CacheModule } from "./cache/cache.module.js";
import { CapacityModule } from "./capacity/capacity.module.js";
import { CargoModule } from "./cargo/cargo.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { EventBusModule } from "./event-bus/event-bus.module.js";
import { HealthModule } from "./health/health.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { ObservabilityModule } from "./observability/observability.module.js";
import { OrganizationsModule } from "./organizations/organizations.module.js";
import { PlanningModule } from "./planning/planning.module.js";
import { RateLimitModule } from "./rate-limit/rate-limit.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { RpcModule } from "./rpc/rpc.module.js";
import { SecurityModule } from "./security/security.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { TariffModule } from "./tariff/tariff.module.js";
import { TeamsModule } from "./teams/teams.module.js";
import { TrackingModule } from "./tracking/tracking.module.js";
import { WebhooksModule } from "./webhooks/webhooks.module.js";

@Module({
  imports: [
    EventBusModule,
    BillingModule,
    RateLimitModule,
    CacheModule,
    DocumentsModule,
    ObservabilityModule,
    HealthModule,
    AdminModule,
    AuditModule,
    IntegrationsModule,
    AuthModule,
    CargoModule,
    TrackingModule,
    CapacityModule,
    PlanningModule,
    NotificationsModule,
    OrganizationsModule,
    ReportsModule,
    SecurityModule,
    SettingsModule,
    TariffModule,
    TeamsModule,
    WebhooksModule,
    RpcModule,
  ],
})
export class AppModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await getPrismaClient()
      .$disconnect()
      .catch(() => {});
  }
}
