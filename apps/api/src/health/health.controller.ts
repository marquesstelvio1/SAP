import { Controller, Get, HttpCode, Inject, Res } from "@nestjs/common";
import type { RuntimeHealthReport } from "@saptm/types";

import { HealthService } from "./health.service.js";

type StatusAwareResponse = {
  status: (code: number) => void;
};

@Controller("health")
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get("live")
  @HttpCode(200)
  live(): RuntimeHealthReport {
    return this.health.getLiveness();
  }

  @Get("ready")
  @HttpCode(200)
  async ready(
    @Res({ passthrough: true }) response: StatusAwareResponse,
  ): Promise<RuntimeHealthReport> {
    const report = await this.health.getReadiness();

    if (report.status !== "ok") {
      response.status(503);
    }

    return report;
  }
}
