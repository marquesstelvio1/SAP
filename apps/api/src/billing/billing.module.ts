import { Module } from "@nestjs/common";

import { EventBusModule } from "../event-bus/event-bus.module.js";
import { BillingService } from "./billing.service.js";
import { BILLING_REPOSITORY } from "./domain/billing.repository.js";
import { UsageEventHandler } from "./events/usage-event-handler.js";
import { PrismaBillingRepository } from "./infrastructure/prisma-billing.repository.js";
import { UsageService } from "./usage.service.js";

@Module({
  imports: [EventBusModule],
  providers: [
    BillingService,
    UsageService,
    UsageEventHandler,
    { provide: BILLING_REPOSITORY, useClass: PrismaBillingRepository },
  ],
  exports: [BillingService, UsageService, BILLING_REPOSITORY],
})
export class BillingModule {}
