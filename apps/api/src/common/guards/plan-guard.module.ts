import { Module } from "@nestjs/common";
import { CacheModule } from "../../cache/cache.module.js";
import { EventBusModule } from "../../event-bus/event-bus.module.js";
import { PlanCacheService } from "./plan-cache.service.js";
import { PlanChangeEventHandler } from "./plan-change-event.handler.js";
import { PlanGuard } from "./plan.guard.js";

@Module({
  imports: [CacheModule, EventBusModule],
  providers: [PlanCacheService, PlanGuard, PlanChangeEventHandler],
  exports: [PlanCacheService, PlanGuard],
})
export class PlanGuardModule {}
