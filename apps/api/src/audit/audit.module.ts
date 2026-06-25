import { Module } from "@nestjs/common";

import { AuditService } from "./audit.service.js";
import { AUDIT_REPOSITORY } from "./domain/audit.repository.js";
import { PrismaAuditRepository } from "./infrastructure/prisma-audit.repository.js";

@Module({
  providers: [AuditService, { provide: AUDIT_REPOSITORY, useClass: PrismaAuditRepository }],
  exports: [AuditService],
})
export class AuditModule {}
