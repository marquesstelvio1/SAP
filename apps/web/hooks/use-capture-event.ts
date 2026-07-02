"use client";

import { useTenantContext } from "@/components/query-tenant-boundary";
import { captureEvent } from "@/lib/analytics";

/**
 * Custom hook that wraps captureEvent and automatically injects the
 * organizationId from the TenantContext into every event.
 *
 * Use this hook in client components instead of importing captureEvent directly.
 */
export function useCaptureEvent() {
  const { organizationId } = useTenantContext();

  function capture(event: string, properties?: Record<string, unknown>) {
    captureEvent(event, {
      ...properties,
      ...(organizationId ? { org_id: organizationId } : {}),
    });
  }

  return capture;
}
