"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export const dynamic = "force-dynamic";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    try {
      Sentry.captureException(error);
    } catch {
      // Cannot report error during prerendering
    }
  }, [error]);

  return (
    <html lang="pt">
      <body
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Erro inesperado</h1>
        <p style={{ color: "#6b7280" }}>Ocorreu um erro inesperado. Tente novamente.</p>
      </body>
    </html>
  );
}
