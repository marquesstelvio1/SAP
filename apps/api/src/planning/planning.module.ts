import { Module } from "@nestjs/common";
import { PLANNING_REPOSITORY } from "./domain/planning.repository.js";
import { PrismaPlanningRepository } from "./infrastructure/prisma-planning.repository.js";
import { PlanningService } from "./planning.service.js";

@Module({
  providers: [
    PlanningService,
    {
      provide: PLANNING_REPOSITORY,
      useClass: PrismaPlanningRepository,
    },
  ],
  exports: [PlanningService],
})
export class PlanningModule {}
