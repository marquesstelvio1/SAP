import type * as React from "react";

import { cn } from "../lib/utils.js";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <div
      data-slot="spinner"
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-label="A carregar"
    >
      <svg
        className="size-5 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        {...props}
      >
        <title>A carregar</title>
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">A carregar</span>
    </div>
  );
}

Spinner.displayName = "Spinner";

export { Spinner };
