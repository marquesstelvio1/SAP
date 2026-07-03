import { Module } from "@nestjs/common";
import { OutboxWorker } from "./outbox.worker.js";

/**
 * OutboxWorkerModule — processes pending outbox events into notifications.
 *
 * The worker polls the `outboxEvent` table for events with status "pending"
 * and creates corresponding notification records with appropriate titles
 * (in PT-PT), severities, and deduplication.
 *
 * This module is self-contained and uses `getPrismaClient()` directly
 * (no DatabaseModule dependency). It can be used standalone via
 * `tsx src/workers/outbox.worker.main.ts` or imported into AppModule.
 */
@Module({
  providers: [OutboxWorker],
})
export class OutboxWorkerModule {}
