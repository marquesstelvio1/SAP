"use client";

import { privacyExportInputSchema, privacyExportOutputSchema } from "@saptm/rpc/privacy";
import { Button, Field, FieldGroup, FieldLabel, SelectNative } from "@saptm/ui";
import { useState } from "react";
import { rpcPost } from "../../lib/rpc-client";

type Feedback = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export type DataExportFormProps = {
  viewerEmail: string;
};

export function DataExportForm({ viewerEmail }: DataExportFormProps) {
  const [format, setFormat] = useState<string>("json");
  const [feedback, setFeedback] = useState<Feedback>({
    status: "idle",
    message: `Conta: ${viewerEmail}. Escolha o formato e clique em "Exportar" para descarregar os seus dados.`,
  });

  async function handleExport() {
    setFeedback({ status: "loading", message: "A processar exportação..." });

    const result = await rpcPost(
      "/rpc/privacy/export",
      privacyExportOutputSchema,
      privacyExportInputSchema.parse({
        format: format as "json" | "csv",
        includeAuditLogs: true,
        includeSessions: true,
      }),
    );

    if (result.status !== "ok") {
      setFeedback({
        status: "error",
        message: result.message,
      });
      return;
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saptm-dados-pessoais-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setFeedback({
      status: "success",
      message: "Exportacao concluida. O ficheiro foi descarregado.",
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleExport();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Formato</FieldLabel>
          <SelectNative value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </SelectNative>
        </Field>
        <Field>
          <p className="text-muted-foreground text-sm">{feedback.message}</p>
        </Field>
      </FieldGroup>
      <div className="mt-4">
        <Button disabled={feedback.status === "loading"} type="submit">
          {feedback.status === "loading" ? "A exportar..." : "Exportar dados"}
        </Button>
      </div>
    </form>
  );
}
