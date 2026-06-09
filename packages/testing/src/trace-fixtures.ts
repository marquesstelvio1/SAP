import type { TraceContext } from "@saptm/observability";
import { createTraceContext } from "@saptm/observability";

export type CreateTestTraceContextInput = Partial<TraceContext>;

export function createTestTraceContext(input: CreateTestTraceContextInput = {}): TraceContext {
  return createTraceContext({
    ...input,
    operationName: input.operationName ?? "test.operation",
    sourceSystem: input.sourceSystem ?? "@saptm/testing",
  });
}
