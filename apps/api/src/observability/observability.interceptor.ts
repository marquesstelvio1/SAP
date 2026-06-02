import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { catchError, finalize, throwError } from "rxjs";

import { ObservabilityService } from "./observability.service.js";
import type {
  RequestWithObservability,
  ResponseWithObservability,
} from "./observability-context.js";

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(@Inject(ObservabilityService) private readonly observability: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithObservability>();
    const response = http.getResponse<ResponseWithObservability>();
    const startedAt = new Date();
    let traceContext = request.traceContext;
    let capturedError: unknown;

    if (!traceContext) {
      traceContext = this.observability.createHttpTraceContext(request);
      request.traceContext = traceContext;
      request.logger = this.observability.createRequestLogger(traceContext, request);
      this.observability.attachResponseHeaders(response, traceContext);
    }

    return next.handle().pipe(
      catchError((error: unknown) => {
        capturedError = error;
        return throwError(() => error);
      }),
      finalize(() => {
        this.observability.recordHttpRequest({
          request,
          response,
          traceContext,
          startedAt,
          error: capturedError,
        });
      }),
    );
  }
}
