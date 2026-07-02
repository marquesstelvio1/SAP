import "reflect-metadata";

import path from "node:path";
import dotenv from "dotenv";

// Load environment variables before any NestJS bootstrap
dotenv.config({ path: path.resolve(import.meta.dirname, "../../../../.env") });

import { NestFactory } from "@nestjs/core";
import { OutboxWorkerModule } from "./outbox.worker.module.js";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(OutboxWorkerModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });

  app.enableShutdownHooks();

  // The worker starts automatically via OnApplicationBootstrap
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start outbox worker", error);
  process.exit(1);
});
