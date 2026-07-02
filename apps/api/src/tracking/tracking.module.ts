import { Module } from "@nestjs/common";
import { EventBusModule } from "../event-bus/event-bus.module.js";
import { TRACKING_REPOSITORY } from "./domain/tracking.repository.js";
import { CargoTrackingEventHandler } from "./events/cargo-event.handler.js";
import { PrismaTrackingRepository } from "./infrastructure/prisma-tracking.repository.js";
import { TrackingService } from "./tracking.service.js";

@Module({
  imports: [EventBusModule],
  providers: [
    TrackingService,
    CargoTrackingEventHandler,
    {
      provide: TRACKING_REPOSITORY,
      useClass: PrismaTrackingRepository,
    },
  ],
  exports: [TrackingService, TRACKING_REPOSITORY],
})
export class TrackingModule {}
