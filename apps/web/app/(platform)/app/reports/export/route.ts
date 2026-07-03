import { type ReportExportDomain, reportExportDomains, reportExportInputSchema } from "@saptm/rpc";

import { getCurrentPlatformSession } from "../../../../../lib/auth-session";
import { exportOperationalReport } from "../../../../../lib/report-exports";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession === undefined) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!platformSession.viewer.permissions.includes("report.export")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain");

  if (domainParam === null || !(reportExportDomains as readonly string[]).includes(domainParam)) {
    return new Response(`Dominio invalido. Use um de: ${reportExportDomains.join(", ")}.`, {
      status: 400,
    });
  }

  const parsedInput = reportExportInputSchema.safeParse({
    domain: domainParam as ReportExportDomain,
    format: "csv",
    limit: 100,
  });

  if (!parsedInput.success) {
    return new Response("Parâmetros de exportação inválidos.", { status: 400 });
  }

  const result = await exportOperationalReport(parsedInput.data);

  if (result.status !== "ok") {
    return new Response(result.message, {
      status: result.status === "forbidden" ? 403 : 502,
    });
  }

  return new Response(result.export.content, {
    headers: {
      "Content-Disposition": `attachment; filename="${result.export.filename}"`,
      "Content-Type": result.export.contentType,
      "X-SAPTM-Report-Export-Id": result.export.audit.subjectId,
      "X-SAPTM-Report-Row-Count": result.export.rowCount.toString(),
    },
  });
}
