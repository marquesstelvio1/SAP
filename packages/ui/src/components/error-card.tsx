import { Button } from "./button.js";
import { Card } from "./card.js";

export function ErrorCard({
  title = "Erro inesperado",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card
      className="flex flex-col items-center justify-center gap-4 p-[var(--density-comfortable-panel-padding)]"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} aria-label="Tentar novamente">
          Tentar novamente
        </Button>
      )}
    </Card>
  );
}

ErrorCard.displayName = "ErrorCard";
