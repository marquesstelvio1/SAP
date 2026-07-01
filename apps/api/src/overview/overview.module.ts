import { Module } from "@nestjs/common";
import { CargoModule } from "../cargo/cargo.module.js";
import { PlanningModule } from "../planning/planning.module.js";
import { TrackingModule } from "../tracking/tracking.module.js";
import { OverviewService } from "./overview.service.js";

@Module({
  imports: [CargoModule, PlanningModule, TrackingModule],
  providers: [OverviewService],
  exports: [OverviewService],
})
export class OverviewModule {}
