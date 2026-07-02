import { Module } from "@nestjs/common";

import { CargoModule } from "../cargo/cargo.module.js";
import { DocumentsService } from "./documents.service.js";

@Module({
  imports: [CargoModule],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
