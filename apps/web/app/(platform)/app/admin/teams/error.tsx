"use client";

import { ErrorCard } from "@saptm/ui";

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center p-4">
      <ErrorCard onRetry={reset} />
    </div>
  );
}
