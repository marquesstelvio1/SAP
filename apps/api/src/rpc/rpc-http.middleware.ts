import type { IncomingMessage, ServerResponse } from "node:http";
import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";
import { RPCHandler } from "@orpc/server/node";

import { AdminService } from "../admin/admin.service.js";
import { AuditService } from "../audit/audit.service.js";
import { CapacityService } from "../capacity/capacity.service.js";
import { CargoService } from "../cargo/cargo.service.js";
import { IntegrationsService } from "../integrations/integrations.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PlanningService } from "../planning/planning.service.js";
import { ReportsService } from "../reports/reports.service.js";
import { TariffService } from "../tariff/tariff.service.js";
import { TrackingService } from "../tracking/tracking.service.js";
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
    @Inject(CargoService)
    cargoService: CargoService,
    @Inject(TrackingService)
    trackingService: TrackingService,
    @Inject(CapacityService)
    capacityService: CapacityService,
    @Inject(IntegrationsService)
    integrationsService: IntegrationsService,
    @Inject(NotificationsService)
    notificationsService: NotificationsService,
    @Inject(PlanningService)
    planningService: PlanningService,
    @Inject(ReportsService)
    reportsService: ReportsService,
    @Inject(TariffService)
    tariffService: TariffService,
    @Inject(RpcContextService)
    rpcContextService: RpcContextService,
  ) {
    this.handler = new RPCHandler(
      createPlatformRpcRouter({
        adminService,
        auditService,
        cargoService,
        trackingService,
        capacityService,
        integrationsService,
        notificationsService,
        planningService,
        reportsService,
        tariffService,
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
      const result = await this.handler.handle(request, response, {
        prefix: "/rpc",
        context: {
          request: request as IncomingMessage & RpcRequestWithAuthContext,
        },
      });

      if (!result.matched) {
        next();
      }
    } catch (error) {
      next(error);
    }
  }
}
