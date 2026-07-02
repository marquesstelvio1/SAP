import { Module } from "@nestjs/common";
import { PlanGuard } from "./plan.guard.js";

@Module({
  providers: [PlanGuard],
  exports: [PlanGuard],
})
export class PlanGuardModule {}
