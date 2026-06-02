import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { ObservabilityModule } from "../observability/observability.module.js";
import { RpcContextService } from "./rpc-context.service.js";

@Module({
  imports: [AuthModule, ObservabilityModule],
  providers: [RpcContextService],
  exports: [RpcContextService],
})
export class RpcModule {}
