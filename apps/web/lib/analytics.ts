"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export function initAnalytics() {
  if (typeof window !== "undefined" && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false,
      loaded: (ph) => {
        if (process.env.NODE_ENV !== "production") {
          ph.debug();
        }
      },
    });
  }
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}

export function resetAnalytics() {
  if (typeof window !== "undefined" && POSTHOG_KEY) {
    posthog.reset();
  }
}

export { PostHogProvider };
