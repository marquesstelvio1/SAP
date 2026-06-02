import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { ObservabilityInterceptor } from "./observability.interceptor.js";
import { ObservabilityMiddleware } from "./observability.middleware.js";
import { ObservabilityService } from "./observability.service.js";

@Module({
  providers: [
    ObservabilityService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ObservabilityInterceptor,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ObservabilityMiddleware).forRoutes("*");
  }
}
