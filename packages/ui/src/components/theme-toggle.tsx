"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";

interface ThemeToggleProps {
  mode?: "switch" | "button";
  className?: string;
}

function ThemeToggle({ className, mode = "button" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (mode === "switch") {
    return (
      <div
        data-slot="theme-toggle"
        className={cn(
          "relative inline-flex h-[var(--density-compact-control-height)] w-14 cursor-pointer items-center rounded-full border border-input bg-muted p-0.5 transition-colors duration-[var(--motion-duration-fast)]",
          className,
        )}
        role="switch"
        aria-checked={theme === "dark"}
        tabIndex={0}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setTheme(theme === "dark" ? "light" : "dark");
          }
        }}
      >
        <span
          className={cn(
            "flex size-[calc(var(--density-compact-control-height)-0.5rem)] items-center justify-center rounded-full bg-background shadow-panel transition-transform duration-[var(--motion-duration-normal)]",
            theme === "dark" ? "translate-x-[calc(100%+0.125rem)]" : "translate-x-0",
          )}
        >
          {theme === "dark" ? <MoonIcon className="size-3.5" /> : <SunIcon className="size-3.5" />}
        </span>
      </div>
    );
  }

  return (
    <Button
      data-slot="theme-toggle"
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ThemeToggle };
