import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import { AdminModule } from "../admin/admin.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { CapacityModule } from "../capacity/capacity.module.js";
import { CargoModule } from "../cargo/cargo.module.js";
import { IntegrationsModule } from "../integrations/integrations.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { ObservabilityModule } from "../observability/observability.module.js";
import { PlanningModule } from "../planning/planning.module.js";
import { ReportsModule } from "../reports/reports.module.js";
import { TariffModule } from "../tariff/tariff.module.js";
import { TrackingModule } from "../tracking/tracking.module.js";
import { RpcContextService } from "./rpc-context.service.js";
import { RpcHttpMiddleware } from "./rpc-http.middleware.js";

@Module({
  imports: [
    AuthModule,
    AdminModule,
    AuditModule,
    IntegrationsModule,
    ObservabilityModule,
    CargoModule,
    TrackingModule,
    CapacityModule,
    PlanningModule,
    NotificationsModule,
    ReportsModule,
    TariffModule,
  ],
  providers: [RpcContextService, RpcHttpMiddleware],
  exports: [RpcContextService],
})
export class RpcModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RpcHttpMiddleware).forRoutes("*");
  }
}
