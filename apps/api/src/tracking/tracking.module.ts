import { Module } from "@nestjs/common";

import { TrackingService } from "./tracking.service.js";

@Module({
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
