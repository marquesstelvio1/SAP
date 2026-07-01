import { forwardRef } from "react";
import { Button } from "./button.js";
import { Card } from "./card.js";

export const ErrorCard = forwardRef<
  HTMLDivElement,
  {
    title?: string;
    message?: string;
    onRetry?: () => void;
  }
>(function ErrorCard({ title = "Erro inesperado", message, onRetry }, ref) {
  return (
    <Card
      ref={ref}
      className="flex flex-col items-center justify-center gap-4 p-8"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
      {onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
    </Card>
  );
});
