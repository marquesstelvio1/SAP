import { Module } from "@nestjs/common";
import { WEBHOOKS_REPOSITORY } from "./domain/webhooks.repository.js";
import { PrismaWebhooksRepository } from "./infrastructure/prisma-webhooks.repository.js";
import { WebhookDeliveryWorker } from "./webhook-delivery.worker.js";
import { WebhooksService } from "./webhooks.service.js";

@Module({
  providers: [
    WebhooksService,
    WebhookDeliveryWorker,
    { provide: WEBHOOKS_REPOSITORY, useClass: PrismaWebhooksRepository },
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
