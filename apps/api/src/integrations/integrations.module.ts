import { Module } from "@nestjs/common";
import { INTEGRATIONS_REPOSITORY } from "./domain/integrations.repository.js";
import { PrismaIntegrationsRepository } from "./infrastructure/prisma-integrations.repository.js";
import { IntegrationsService } from "./integrations.service.js";

@Module({
  providers: [
    IntegrationsService,
    {
      provide: INTEGRATIONS_REPOSITORY,
      useClass: PrismaIntegrationsRepository,
    },
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
