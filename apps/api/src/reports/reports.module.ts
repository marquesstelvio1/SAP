import { Module } from "@nestjs/common";

import { REPORTS_REPOSITORY } from "./domain/reports.repository.js";
import { PrismaReportsRepository } from "./infrastructure/prisma-reports.repository.js";
import { ReportsService } from "./reports.service.js";

@Module({
  providers: [ReportsService, { provide: REPORTS_REPOSITORY, useClass: PrismaReportsRepository }],
  exports: [ReportsService],
})
export class ReportsModule {}
