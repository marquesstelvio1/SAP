import { Module } from "@nestjs/common";

import { AdminService } from "./admin.service.js";
import { ADMIN_REPOSITORY } from "./domain/admin.repository.js";
import { PrismaAdminRepository } from "./infrastructure/prisma-admin.repository.js";

@Module({
  providers: [
    AdminService,
    { provide: ADMIN_REPOSITORY, useClass: PrismaAdminRepository },
  ],
  exports: [AdminService],
})
export class AdminModule {}
