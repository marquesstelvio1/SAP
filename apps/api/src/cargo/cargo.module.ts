import { Module } from "@nestjs/common";

import { CargoService } from "./cargo.service.js";

@Module({
  providers: [CargoService],
  exports: [CargoService],
})
export class CargoModule {}
