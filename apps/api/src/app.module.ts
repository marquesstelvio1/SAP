import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { ObservabilityModule } from "./observability/observability.module.js";
import { RpcModule } from "./rpc/rpc.module.js";

@Module({
  imports: [ObservabilityModule, AuthModule, RpcModule],
})
export class AppModule {}
