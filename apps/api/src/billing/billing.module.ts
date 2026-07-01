import { Module } from "@nestjs/common";

import { BillingService } from "./billing.service.js";
import { BILLING_REPOSITORY } from "./domain/billing.repository.js";
import { PrismaBillingRepository } from "./infrastructure/prisma-billing.repository.js";
import { UsageService } from "./usage.service.js";

@Module({
  providers: [
    BillingService,
    UsageService,
    { provide: BILLING_REPOSITORY, useClass: PrismaBillingRepository },
  ],
  exports: [BillingService, UsageService, BILLING_REPOSITORY],
})
export class BillingModule {}
