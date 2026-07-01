import { Module } from "@nestjs/common";

import { CacheModule } from "../cache/cache.module.js";
import { CapacityService } from "./capacity.service.js";
import { CAPACITY_REPOSITORY } from "./domain/capacity.repository.js";
import { PrismaCapacityRepository } from "./infrastructure/prisma-capacity.repository.js";

@Module({
  imports: [CacheModule],
  providers: [
    CapacityService,
    {
      provide: CAPACITY_REPOSITORY,
      useClass: PrismaCapacityRepository,
    },
  ],
  exports: [CapacityService],
})
export class CapacityModule {}
