import { Module } from "@nestjs/common";

import { NOTIFICATIONS_REPOSITORY } from "./domain/notifications.repository.js";
import { PrismaNotificationsRepository } from "./infrastructure/prisma-notifications.repository.js";
import { NotificationsService } from "./notifications.service.js";

@Module({
  providers: [
    NotificationsService,
    { provide: NOTIFICATIONS_REPOSITORY, useClass: PrismaNotificationsRepository },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
