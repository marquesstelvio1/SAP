import { Module } from "@nestjs/common";

import { AdminModule } from "./admin/admin.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CapacityModule } from "./capacity/capacity.module.js";
import { CargoModule } from "./cargo/cargo.module.js";
import { HealthModule } from "./health/health.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { ObservabilityModule } from "./observability/observability.module.js";
import { PlanningModule } from "./planning/planning.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { RpcModule } from "./rpc/rpc.module.js";
import { TariffModule } from "./tariff/tariff.module.js";
import { TrackingModule } from "./tracking/tracking.module.js";

@Module({
  imports: [
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
    ReportsModule,
    TariffModule,
    RpcModule,
  ],
})
export class AppModule {}
