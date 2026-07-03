import { Module } from "@nestjs/common";

import { RpcModule } from "../rpc/rpc.module.js";
import { OpenapiController } from "./openapi.controller.js";
import { OpenapiService } from "./openapi.service.js";

@Module({
  imports: [RpcModule],
  controllers: [OpenapiController],
  providers: [OpenapiService],
})
export class OpenapiModule {}
