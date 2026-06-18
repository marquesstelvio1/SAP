import { Module } from "@nestjs/common";

import { TariffService } from "./tariff.service.js";

@Module({
  providers: [TariffService],
  exports: [TariffService],
})
export class TariffModule {}
