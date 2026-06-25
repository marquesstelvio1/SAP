import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module.js";
import { TRACKING_REPOSITORY } from "./domain/tracking.repository.js";
import { PrismaTrackingRepository } from "./infrastructure/prisma-tracking.repository.js";
import { TrackingService } from "./tracking.service.js";

@Module({
  imports: [BillingModule],
  providers: [
    TrackingService,
    {
      provide: TRACKING_REPOSITORY,
      useClass: PrismaTrackingRepository,
    },
  ],
  exports: [TrackingService],
})
export class TrackingModule {}
