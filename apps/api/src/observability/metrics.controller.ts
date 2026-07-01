import { Controller, Get, Header, Inject } from "@nestjs/common";
import { seconds, Throttle } from "@nestjs/throttler";
import { prometheusContentType } from "@saptm/observability";

import { Public } from "../auth/public.decorator.js";
import { ObservabilityService } from "./observability.service.js";

@Controller()
export class MetricsController {
  constructor(@Inject(ObservabilityService) private readonly observability: ObservabilityService) {}

  /**
   * Prometheus metrics endpoint.
   *
   * Marked as @Public() to bypass the global AuthorizationGuard
   * (which requires explicit @RequireAuthorization() metadata on all routes).
   *
   * In production, access to this endpoint SHOULD be restricted at the
   * network level (firewall / Kubernetes NetworkPolicy) to allow only
   * Prometheus servers to scrape it. Do NOT expose this endpoint to the
   * public internet without authentication. For additional security,
   * consider adding an API key check or IP allowlist.
   *
   * ── Rate limiting ─────────────────────────────────────────────────
   * The `api` throttler is reduced from the global 200 req/min to
   * 20 req/min so that even if the network ACL is bypassed the scrape
   * rate is bounded.  This is intentionally generous enough to support
   * multiple Prometheus servers (or a single server with a 15 s scrape
   * interval) while still preventing abuse.
   */
  @Public()
  @Get("metrics")
  @Throttle({ api: { limit: 20, ttl: seconds(60) } })
  @Header("Content-Type", prometheusContentType)
  metrics(): string {
    return this.observability.renderPrometheusMetrics();
  }
}
