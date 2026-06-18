import { Controller, Get, Header, Inject } from "@nestjs/common";
import { prometheusContentType } from "@saptm/observability";

import { ObservabilityService } from "./observability.service.js";

@Controller()
export class MetricsController {
  constructor(@Inject(ObservabilityService) private readonly observability: ObservabilityService) {}

  @Get("metrics")
  @Header("Content-Type", prometheusContentType)
  metrics(): string {
    return this.observability.renderPrometheusMetrics();
  }
}
