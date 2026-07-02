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
    <div className="mx-auto flex max-w-6xl items-start justify-center px-6 py-20">
      <ErrorCard onRetry={reset} />
    </div>
  );
}
