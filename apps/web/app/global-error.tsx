"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body>
        <main
          style={{
            alignItems: "center",
            backgroundColor: "var(--background)",
            display: "flex",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "28rem", width: "100%" }}>
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                padding: "2rem",
              }}
            >
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Erro inesperado
              </h1>
              <p
                style={{
                  color: "var(--muted-foreground)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  margin: "0.5rem 0 1.5rem",
                  textAlign: "center",
                }}
              >
                {error.message}
              </p>
              <style>{`
                .ge-btn:focus-visible {
                  outline: 2px solid var(--ring, #888);
                  outline-offset: 2px;
                }
              `}</style>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  className="ge-btn"
                  onClick={reset}
                  style={{
                    background: "var(--foreground)",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "var(--background)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    padding: "0.625rem 1rem",
                    width: "100%",
                  }}
                  type="button"
                >
                  Tentar novamente
                </button>
                <a
                  className="ge-btn"
                  href="/app"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    color: "var(--foreground)",
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    padding: "0.625rem 1rem",
                    textAlign: "center",
                    textDecoration: "none",
                    width: "100%",
                  }}
                >
                  Voltar ao inicio
                </a>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
