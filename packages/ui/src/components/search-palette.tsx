"use client";

import { type ReactNode, useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command.js";

interface SearchItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  onSelect: () => void;
  category?: string;
}

interface SearchPaletteProps {
  items: SearchItem[];
  placeholder?: string;
  emptyMessage?: string;
  shortcut?: string[];
}

function SearchPalette({
  items,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  shortcut = ["meta", "k"],
}: SearchPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaK =
        shortcut.includes("meta") && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isMetaK) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut]);

  const grouped = items.reduce<Record<string, SearchItem[]>>((acc, item) => {
    const cat = item.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <CommandGroup key={category} heading={category}>
            {categoryItems.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => {
                  item.onSelect();
                  setOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.description ? (
                  <span className="ml-auto text-muted-foreground text-xs">{item.description}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export { type SearchItem, SearchPalette, type SearchPaletteProps };
