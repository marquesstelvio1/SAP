import { Module } from "@nestjs/common";

import { ORGANIZATIONS_REPOSITORY } from "./domain/organizations.repository.js";
import { PrismaOrganizationsRepository } from "./infrastructure/prisma-organizations.repository.js";
import { OrganizationsService } from "./organizations.service.js";

@Module({
  providers: [
    OrganizationsService,
    {
      provide: ORGANIZATIONS_REPOSITORY,
      useClass: PrismaOrganizationsRepository,
    },
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
