import { Module } from "@nestjs/common";

import { PrivacyService } from "./privacy.service.js";

@Module({
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
