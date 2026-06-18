import { type AuditExportInput, auditExportInputSchema } from "@saptm/rpc";
import type { NextRequest } from "next/server";

import { exportAuditRecords } from "../../../../../lib/audit-records";
import { getCurrentPlatformSession } from "../../../../../lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession === undefined) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  if (
    !platformSession.viewer.permissions.includes("audit.read") ||
    !platformSession.viewer.permissions.includes("report.export")
  ) {
    return new Response("Forbidden", {
      status: 403,
    });
  }

  const parsedInput = parseAuditExportRequest(request);

  if (!("input" in parsedInput)) {
    return new Response(parsedInput.message, {
      status: 400,
    });
  }

  const result = await exportAuditRecords(parsedInput.input);

  if (result.status !== "ok") {
    return new Response(result.message, {
      status: result.status === "forbidden" ? 403 : 502,
    });
  }

  return new Response(result.export.content, {
    headers: {
      "Content-Disposition": `attachment; filename="${result.export.filename}"`,
      "Content-Type": result.export.contentType,
      "X-SAPTM-Audit-Export-Id": result.export.audit.subjectId,
      "X-SAPTM-Audit-Row-Count": result.export.rowCount.toString(),
    },
  });
}

function parseAuditExportRequest(request: NextRequest):
  | {
      input: AuditExportInput;
    }
  | {
      message: string;
    } {
  const searchParams = request.nextUrl.searchParams;
  const parsed = auditExportInputSchema.safeParse(
    removeUndefinedValues({
      action: readOptionalSearchParam(searchParams, "action"),
      actorId: readOptionalSearchParam(searchParams, "actorId"),
      actorType: readOptionalSearchParam(searchParams, "actorType"),
      correlationId: readOptionalSearchParam(searchParams, "correlationId"),
      createdFrom: readOptionalDateSearchParam(searchParams, "createdFrom"),
      createdTo: readOptionalDateSearchParam(searchParams, "createdTo"),
      format: "csv",
      limit: readLimitSearchParam(searchParams),
      severity: readOptionalSearchParam(searchParams, "severity"),
      subjectId: readOptionalSearchParam(searchParams, "subjectId"),
      subjectType: readOptionalSearchParam(searchParams, "subjectType"),
    }),
  );

  if (!parsed.success) {
    return {
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsed.data,
  };
}

function readOptionalSearchParam(searchParams: URLSearchParams, name: string): string | undefined {
  const value = searchParams.get(name);

  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}

function readOptionalDateSearchParam(
  searchParams: URLSearchParams,
  name: string,
): string | undefined {
  const value = readOptionalSearchParam(searchParams, name);

  if (value === undefined) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function readLimitSearchParam(searchParams: URLSearchParams): number {
  const value = readOptionalSearchParam(searchParams, "limit");

  if (value === undefined) {
    return 100;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 100;
}

function removeUndefinedValues(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
