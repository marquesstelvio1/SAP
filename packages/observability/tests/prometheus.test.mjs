import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createPrometheusRegistry,
  createTraceContext,
  InMemoryPrometheusRegistry,
} from "../dist/index.js";

function makeTraceContext() {
  return createTraceContext({ operationName: "test", sourceSystem: "test" });
}

function counter(overrides = {}) {
  return {
    signal: "metric",
    timestamp: new Date().toISOString(),
    serviceName: "test-service",
    environment: "test",
    context: makeTraceContext(),
    attributes: {},
    name: "http_requests",
    kind: "counter",
    value: 1,
    ...overrides,
  };
}

function gauge(overrides = {}) {
  return {
    signal: "metric",
    timestamp: new Date().toISOString(),
    serviceName: "test-service",
    environment: "test",
    context: makeTraceContext(),
    attributes: {},
    name: "memory_usage",
    kind: "gauge",
    value: 512,
    ...overrides,
  };
}

function histogram(overrides = {}) {
  return {
    signal: "metric",
    timestamp: new Date().toISOString(),
    serviceName: "test-service",
    environment: "test",
    context: makeTraceContext(),
    attributes: {},
    name: "request_duration",
    kind: "histogram",
    value: 150,
    ...overrides,
  };
}

describe("InMemoryPrometheusRegistry", () => {
  describe("counter", () => {
    it("starts at the first recorded value", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter({ value: 5 }));

      const output = registry.render();
      assert.ok(output.includes("http_requests_total"));
      assert.ok(output.includes("5"));
    });

    it("accumulates on subsequent records", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter({ value: 3 }));
      registry.record(counter({ value: 7 }));

      const output = registry.render();
      assert.ok(output.includes("10"));
    });

    it("appends _total suffix", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter());

      const output = registry.render();
      assert.ok(output.includes("http_requests_total"));
    });
  });

  describe("gauge", () => {
    it("sets the value directly", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(gauge({ value: 100 }));

      const output = registry.render();
      assert.ok(output.includes("memory_usage"));
      assert.ok(output.includes("100"));
    });

    it("overwrites previous value", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(gauge({ value: 100 }));
      registry.record(gauge({ value: 200 }));

      const output = registry.render();
      assert.ok(output.includes("200"));
      assert.ok(!output.includes("100"));
    });
  });

  describe("histogram", () => {
    it("tracks count, sum, and buckets", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(histogram({ value: 50 }));
      registry.record(histogram({ value: 150 }));
      registry.record(histogram({ value: 300 }));

      const output = registry.render();
      assert.ok(output.includes("request_duration_count{"));
      assert.ok(output.includes("_count"));
      assert.ok(output.includes("request_duration_sum{"));
      assert.ok(output.includes("_bucket{"));
      assert.ok(output.includes('le="+Inf"'));
    });

    it("places values in correct buckets", () => {
      const registry = new InMemoryPrometheusRegistry({
        histogramBuckets: [10, 100, 1000],
      });
      registry.record(histogram({ value: 5 }));
      registry.record(histogram({ value: 50 }));
      registry.record(histogram({ value: 500 }));

      const output = registry.render();
      assert.ok(output.includes('le="10"'));
      assert.ok(output.includes('le="100"'));
      assert.ok(output.includes('le="1000"'));
      assert.ok(output.includes('le="+Inf"'));
    });
  });

  describe("render", () => {
    it("includes HELP and TYPE lines", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter());

      const output = registry.render();
      assert.ok(output.includes("# HELP"));
      assert.ok(output.includes("# TYPE"));
    });

    it("renders multiple metric types", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter());
      registry.record(gauge());

      const output = registry.render();
      assert.ok(output.includes("http_requests_total"));
      assert.ok(output.includes("memory_usage"));
    });

    it("ends with a trailing newline", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter());

      const output = registry.render();
      assert.ok(output.endsWith("\n"));
    });
  });

  describe("reset", () => {
    it("clears all series", () => {
      const registry = new InMemoryPrometheusRegistry();
      registry.record(counter());
      registry.reset();

      const output = registry.render();
      assert.equal(output, "");
    });
  });

  describe("createPrometheusRegistry", () => {
    it("returns an InMemoryPrometheusRegistry instance", () => {
      const registry = createPrometheusRegistry();
      assert.ok(registry instanceof InMemoryPrometheusRegistry);
    });
  });
});
