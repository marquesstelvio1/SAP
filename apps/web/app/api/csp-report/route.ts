import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { extractClientIp, rateLimiter } from "@/lib/rate-limiter";

/**
 * Maximum CSP report body size in bytes (200 KB).
 * CSP reports can include script samples which increase payload size.
 */
const MAX_BODY_SIZE = 1024 * 200;

type CspReport = {
  "csp-report"?: {
    "document-uri": string;
    referrer: string;
    "blocked-uri": string;
    "violated-directive": string;
    "effective-directive": string;
    "original-policy": string;
    disposition: string;
    "script-sample": string;
    "status-code": number;
    "source-file": string;
    "line-number": number;
    "column-number": number;
  };
};

function parseCspReport(body: unknown): CspReport["csp-report"] | null {
  if (typeof body !== "object" || body === null) return null;

  const report = body as CspReport;
  const cspReport = report["csp-report"];

  if (!cspReport || typeof cspReport["document-uri"] !== "string") return null;

  return cspReport;
}

export async function POST(request: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────
  // CSP reports can be submitted by any page the browser loads.  Without
  // rate limiting an attacker could flood this endpoint with fake reports.
  const ip = extractClientIp(request);
  const rlResult = rateLimiter.check("csp-report", ip, {
    windowMs: 60_000,
    max: 10,
  });

  if (!rlResult.allowed) {
    return NextResponse.json(
      { error: "Demasiados pedidos. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rlResult.resetEpochMs - Date.now()) / 1000)),
        },
      },
    );
  }

  // ── Origin validation ─────────────────────────────────────────────────
  const contentType = request.headers.get("content-type") ?? "";

  // Validate that the report originates from our own application
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl !== undefined) {
    const allowedOrigins = [appUrl, appUrl.replace(/\/+$/, "")];
    const isAllowedOrigin =
      origin !== null
        ? allowedOrigins.some((allowed) => origin.startsWith(allowed))
        : referer !== null
          ? allowedOrigins.some((allowed) => referer.startsWith(allowed))
          : false;
    if (!isAllowedOrigin) {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    }
  }

  // ── Body size limit ───────────────────────────────────────────────────
  // CSP reports with large script-sample values could exceed acceptable size.
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number.parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // ── Body parsing ──────────────────────────────────────────────────────
  try {
    if (contentType === "application/csp-report") {
      const text = await request.text();

      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const cspReport = parseCspReport(parsed);

        if (!cspReport) {
          return NextResponse.json({ error: "Invalid CSP report format" }, { status: 400 });
        }

        processCspReport(cspReport);
      } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
    } else if (contentType === "application/json") {
      const parsed = (await request.json()) as Record<string, unknown>;
      const cspReport = parseCspReport(parsed);

      if (!cspReport) {
        return NextResponse.json({ error: "Invalid CSP report format" }, { status: 400 });
      }

      processCspReport(cspReport);
    } else {
      const text = await request.text();

      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const cspReport = parseCspReport(parsed);

        if (cspReport) {
          processCspReport(cspReport);
        } else {
          return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
        }
      } catch {
        return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function processCspReport(cspReport: NonNullable<ReturnType<typeof parseCspReport>>): void {
  const { NODE_ENV, LOG_LEVEL } = process.env;
  const isDev = NODE_ENV === "development";
  const isDebug = isDev || LOG_LEVEL === "debug";

  const entry = {
    severity: "warning",
    event: "csp_violation",
    documentUri: cspReport["document-uri"],
    violatedDirective: cspReport["violated-directive"],
    blockedUri: cspReport["blocked-uri"],
    sourceFile: cspReport["source-file"],
    lineNumber: cspReport["line-number"],
    columnNumber: cspReport["column-number"],
    disposition: cspReport.disposition,
    originalPolicy: cspReport["original-policy"],
    userAgent: cspReport["script-sample"]
      ? { scriptSample: cspReport["script-sample"] }
      : undefined,
  };

  if (isDebug) {
    process.stdout.write(`${JSON.stringify({ ...entry, timestamp: new Date().toISOString() })}\n`);
  }
}
