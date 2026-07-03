import type { RawBodyRequest } from "@nestjs/common";
import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import type { Request } from "express";

// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { BillingService } from "./billing.service.js";

@Controller("billing")
export class BillingWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ): Promise<{ received: boolean }> {
    const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body));

    await this.billingService.handleWebhook(payload, signature);

    return { received: true };
  }
}
