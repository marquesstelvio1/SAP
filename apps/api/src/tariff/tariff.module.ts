import { Module } from "@nestjs/common";
import { TARIFF_REPOSITORY } from "./domain/tariff.repository.js";
import { PrismaTariffRepository } from "./infrastructure/prisma-tariff.repository.js";
import { TariffService } from "./tariff.service.js";

@Module({
  providers: [
    TariffService,
    {
      provide: TARIFF_REPOSITORY,
      useClass: PrismaTariffRepository,
    },
  ],
  exports: [TariffService],
})
export class TariffModule {}
