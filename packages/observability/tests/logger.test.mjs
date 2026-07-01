import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createConsoleLogger, createTraceContext } from "../dist/index.js";

function makeDefaultContext() {
  return createTraceContext({ operationName: "test", sourceSystem: "test" });
}

describe("createConsoleLogger", () => {
  it("logs at info level by default", () => {
    const records = [];
    const logger = createConsoleLogger({
      serviceName: "test-service",
      environment: "test",
      defaultContext: makeDefaultContext(),
      sink: (record) => records.push(record),
    });

    const result = logger.info("hello world");

    assert.equal(records.length, 1);
    assert.equal(records[0].level, "info");
    assert.equal(records[0].message, "hello world");
    assert.equal(records[0].serviceName, "test-service");
    assert.equal(records[0].signal, "log");
    assert.equal(result.level, "info");
  });

  it("returns undefined for below-minimum-level logs", () => {
    const logger = createConsoleLogger({
      serviceName: "test-service",
      environment: "test",
      defaultContext: makeDefaultContext(),
      minimumLevel: "warn",
      sink: () => {},
    });

    assert.equal(logger.debug("should be filtered"), undefined);
    assert.equal(logger.info("should be filtered"), undefined);
  });

  it("emits warn and error logs when minimumLevel is warn", () => {
    const records = [];
    const logger = createConsoleLogger({
      serviceName: "test-service",
      environment: "test",
      defaultContext: makeDefaultContext(),
      minimumLevel: "warn",
      sink: (record) => records.push(record),
    });

    logger.debug("skip");
    logger.info("skip");
    logger.warn("keep");
    logger.error("keep");

    assert.equal(records.length, 2);
    assert.equal(records[0].level, "warn");
    assert.equal(records[1].level, "error");
  });

  it("redacts sensitive attributes", () => {
    const records = [];
    const logger = createConsoleLogger({
      serviceName: "test-service",
      environment: "test",
      defaultContext: makeDefaultContext(),
      sink: (record) => records.push(record),
    });

    logger.info("user login", {
      attributes: {
        username: "jane",
        password: "supersecret",
        api_key: "sk-1234",
      },
    });

    assert.equal(records.length, 1);
    assert.equal(records[0].attributes.username, "jane");
    assert.equal(records[0].attributes.password, "[REDACTED]");
    assert.equal(records[0].attributes.api_key, "[REDACTED]");
  });

  it("includes error details when provided", () => {
    const records = [];
    const logger = createConsoleLogger({
      serviceName: "test-service",
      environment: "test",
      defaultContext: makeDefaultContext(),
      sink: (record) => records.push(record),
    });

    const error = new Error("something broke");
    logger.error("operation failed", { error });

    assert.equal(records.length, 1);
    assert.equal(records[0].error.name, "Error");
    assert.equal(records[0].error.message, "something broke");
    assert.ok(records[0].error.stack !== undefined);
  });

  it("merges context overrides", () => {
    const records = [];
    const logger = createConsoleLogger({
      serviceName: "test-service",
      environment: "test",
      defaultContext: makeDefaultContext(),
      sink: (record) => records.push(record),
    });

    logger.info("test", {
      context: { tenantId: "org_123" },
    });

    assert.equal(records.length, 1);
    assert.equal(records[0].context.tenantId, "org_123");
    assert.equal(records[0].context.operationName, "test");
  });
});
