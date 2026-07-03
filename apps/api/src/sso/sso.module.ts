import { Module } from "@nestjs/common";

import { SSO_REPOSITORY } from "./domain/sso.repository.js";
import { PrismaSsoRepository } from "./infrastructure/prisma-sso.repository.js";
import { SsoService } from "./sso.service.js";

@Module({
  providers: [SsoService, { provide: SSO_REPOSITORY, useClass: PrismaSsoRepository }],
  exports: [SsoService],
})
export class SsoModule {}
