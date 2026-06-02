import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";

import { ObservabilityService } from "./observability.service.js";
import type {
  RequestWithObservability,
  ResponseWithObservability,
} from "./observability-context.js";

type NextFunction = () => void;

@Injectable()
export class ObservabilityMiddleware implements NestMiddleware {
  constructor(@Inject(ObservabilityService) private readonly observability: ObservabilityService) {}

  use(
    request: RequestWithObservability,
    response: ResponseWithObservability,
    next: NextFunction,
  ): void {
    const traceContext = this.observability.createHttpTraceContext(request);

    request.traceContext = traceContext;
    request.logger = this.observability.createRequestLogger(traceContext, request);
    this.observability.attachResponseHeaders(response, traceContext);

    next();
  }
}
