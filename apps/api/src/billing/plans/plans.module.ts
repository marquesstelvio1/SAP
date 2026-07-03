import { Module } from "@nestjs/common";

import { EventBusModule } from "../../event-bus/event-bus.module.js";
import { PLANS_REPOSITORY } from "./plans.repository.js";
import { PlansService } from "./plans.service.js";
import { PrismaPlansRepository } from "./prisma-plans.repository.js";

@Module({
  imports: [EventBusModule],
  providers: [PlansService, { provide: PLANS_REPOSITORY, useClass: PrismaPlansRepository }],
  exports: [PlansService],
})
export class PlansModule {}
