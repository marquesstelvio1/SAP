"use client";

import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

type MetricCallback = (metric: { name: string; value: number; rating: string }) => void;

const vitalsUrl = "https://vitals.vercel-analytics.com/v1/vitals";

function sendToAnalytics(metric: { name: string; value: number; rating: string }) {
  const body = {
    dsn: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    id: metric.name,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: metric.rating,
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, JSON.stringify(body));
  } else {
    fetch(vitalsUrl, { method: "POST", body: JSON.stringify(body), keepalive: true });
  }
}

export function reportWebVitals(onPerfEntry?: MetricCallback) {
  try {
    onCLS(onPerfEntry || sendToAnalytics);
    onFCP(onPerfEntry || sendToAnalytics);
    onLCP(onPerfEntry || sendToAnalytics);
    onINP(onPerfEntry || sendToAnalytics);
    onTTFB(onPerfEntry || sendToAnalytics);
  } catch (error) {
    console.warn("Failed to report web vitals:", error);
  }
}
