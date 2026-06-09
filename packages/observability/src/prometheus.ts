import type { MetricKind, MetricRecord, TelemetryAttributeValue } from "./index.js";

export const prometheusContentType = "text/plain; version=0.0.4; charset=utf-8";

export const defaultPrometheusHistogramBucketsMs = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000,
] as const;

export type PrometheusRegistryOptions = {
  histogramBuckets?: readonly number[];
};

type PrometheusLabels = Record<string, string>;

type BaseSeries = {
  metricName: string;
  sourceName: string;
  kind: MetricKind;
  labels: PrometheusLabels;
  help: string;
};

type CounterSeries = BaseSeries & {
  kind: "counter";
  value: number;
};

type GaugeSeries = BaseSeries & {
  kind: "gauge";
  value: number;
};

type HistogramSeries = BaseSeries & {
  kind: "histogram";
  count: number;
  sum: number;
  buckets: Map<number, number>;
};

type PrometheusSeries = CounterSeries | GaugeSeries | HistogramSeries;

export class InMemoryPrometheusRegistry {
  private readonly series = new Map<string, PrometheusSeries>();
  private readonly histogramBuckets: readonly number[];

  constructor(options: PrometheusRegistryOptions = {}) {
    this.histogramBuckets = options.histogramBuckets ?? defaultPrometheusHistogramBucketsMs;
  }

  record(metric: MetricRecord): void {
    const metricName = normalizeMetricName(metric.name, metric.kind);
    const labels = normalizeMetricLabels(metric);
    const key = createSeriesKey(metricName, metric.kind, labels);
    const existing = this.series.get(key);

    if (metric.kind === "counter") {
      const value = existing?.kind === "counter" ? existing.value + metric.value : metric.value;
      this.series.set(key, createCounterSeries(metric, metricName, labels, value));
      return;
    }

    if (metric.kind === "gauge") {
      this.series.set(key, createGaugeSeries(metric, metricName, labels));
      return;
    }

    const histogram =
      existing?.kind === "histogram"
        ? existing
        : createHistogramSeries(metric, metricName, labels, this.histogramBuckets);

    histogram.count += 1;
    histogram.sum += metric.value;

    for (const bucket of this.histogramBuckets) {
      if (metric.value <= bucket) {
        histogram.buckets.set(bucket, (histogram.buckets.get(bucket) ?? 0) + 1);
      }
    }

    this.series.set(key, histogram);
  }

  render(): string {
    const lines: string[] = [];
    const groups = groupSeriesByMetricName([...this.series.values()]);

    for (const [metricName, group] of groups) {
      const first = group[0];

      if (first === undefined) {
        continue;
      }

      lines.push(`# HELP ${metricName} ${escapeHelp(first.help)}`);
      lines.push(`# TYPE ${metricName} ${first.kind}`);

      for (const series of group) {
        if (series.kind === "histogram") {
          lines.push(...renderHistogramSeries(series));
          continue;
        }

        lines.push(`${series.metricName}${renderLabels(series.labels)} ${series.value}`);
      }
    }

    lines.push("");
    return lines.join("\n");
  }

  reset(): void {
    this.series.clear();
  }
}

export function createPrometheusRegistry(
  options?: PrometheusRegistryOptions,
): InMemoryPrometheusRegistry {
  return new InMemoryPrometheusRegistry(options);
}

function createCounterSeries(
  metric: MetricRecord,
  metricName: string,
  labels: PrometheusLabels,
  value: number,
): CounterSeries {
  return {
    metricName,
    sourceName: metric.name,
    kind: "counter",
    labels,
    help: createMetricHelp(metric),
    value,
  };
}

function createGaugeSeries(
  metric: MetricRecord,
  metricName: string,
  labels: PrometheusLabels,
): GaugeSeries {
  return {
    metricName,
    sourceName: metric.name,
    kind: "gauge",
    labels,
    help: createMetricHelp(metric),
    value: metric.value,
  };
}

function createHistogramSeries(
  metric: MetricRecord,
  metricName: string,
  labels: PrometheusLabels,
  buckets: readonly number[],
): HistogramSeries {
  return {
    metricName,
    sourceName: metric.name,
    kind: "histogram",
    labels,
    help: createMetricHelp(metric),
    count: 0,
    sum: 0,
    buckets: new Map(buckets.map((bucket) => [bucket, 0])),
  };
}

function renderHistogramSeries(series: HistogramSeries): string[] {
  const lines: string[] = [];

  for (const [bucket, value] of series.buckets) {
    lines.push(
      `${series.metricName}_bucket${renderLabels({
        ...series.labels,
        le: String(bucket),
      })} ${value}`,
    );
  }

  lines.push(
    `${series.metricName}_bucket${renderLabels({
      ...series.labels,
      le: "+Inf",
    })} ${series.count}`,
  );
  lines.push(`${series.metricName}_sum${renderLabels(series.labels)} ${series.sum}`);
  lines.push(`${series.metricName}_count${renderLabels(series.labels)} ${series.count}`);

  return lines;
}

function normalizeMetricName(name: string, kind: MetricKind): string {
  const normalized = name.replace(/[^a-zA-Z0-9_:]/g, "_").replace(/^[^a-zA-Z_:]/, "_");

  if (kind === "counter" && !normalized.endsWith("_total")) {
    return `${normalized}_total`;
  }

  return normalized;
}

function normalizeMetricLabels(metric: MetricRecord): PrometheusLabels {
  const labels: PrometheusLabels = {
    environment: metric.environment,
    service_name: metric.serviceName,
  };

  for (const [key, value] of Object.entries(metric.attributes)) {
    labels[normalizeLabelName(key)] = normalizeLabelValue(value);
  }

  return sortLabels(labels);
}

function normalizeLabelName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^[^a-zA-Z_]/, "_");
}

function normalizeLabelValue(value: TelemetryAttributeValue): string {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(",");
  }

  return String(value);
}

function sortLabels(labels: PrometheusLabels): PrometheusLabels {
  return Object.fromEntries(
    Object.entries(labels).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function renderLabels(labels: PrometheusLabels): string {
  const entries = Object.entries(labels);

  if (entries.length === 0) {
    return "";
  }

  return `{${entries.map(([key, value]) => `${key}="${escapeLabelValue(value)}"`).join(",")}}`;
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function escapeHelp(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
}

function createSeriesKey(metricName: string, kind: MetricKind, labels: PrometheusLabels): string {
  return JSON.stringify([metricName, kind, labels]);
}

function createMetricHelp(metric: MetricRecord): string {
  const unit = metric.unit === undefined ? "" : ` (${metric.unit})`;

  return `${metric.name}${unit}`;
}

function groupSeriesByMetricName(series: PrometheusSeries[]): Map<string, PrometheusSeries[]> {
  const groups = new Map<string, PrometheusSeries[]>();

  for (const item of series) {
    const group = groups.get(item.metricName) ?? [];
    group.push(item);
    groups.set(item.metricName, group);
  }

  return new Map([...groups.entries()].sort(([left], [right]) => left.localeCompare(right)));
}
