import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module.js";
import { CargoService } from "./cargo.service.js";
import { CARGO_REPOSITORY, type CargoRepository } from "./domain/cargo.repository.js";
import { PrismaCargoRepository } from "./infrastructure/prisma-cargo.repository.js";

export type { CargoRepository };
export { CARGO_REPOSITORY };

@Module({
  imports: [BillingModule],
  providers: [
    CargoService,
    {
      provide: CARGO_REPOSITORY,
      useClass: PrismaCargoRepository,
    },
  ],
  exports: [CargoService, CARGO_REPOSITORY],
})
export class CargoModule {}
