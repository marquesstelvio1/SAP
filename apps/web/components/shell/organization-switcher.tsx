"use client";

import { Avatar, AvatarFallback, Popover, PopoverContent, PopoverTrigger } from "@saptm/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import type { UserOrganization } from "../../lib/org-actions";
import {
  getActiveOrganizationId,
  getUserOrganizationsAction,
  setActiveOrganization,
} from "../../lib/org-actions";

type OrganizationSwitcherState =
  | { status: "loading" }
  | { status: "loaded"; organizations: UserOrganization[]; activeOrgId: string | undefined }
  | { status: "error"; message: string };

export function OrganizationSwitcher() {
  const [state, setState] = useState<OrganizationSwitcherState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const id = useId();

  useEffect(() => {
    void loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      const [organizations, activeOrgId] = await Promise.all([
        getUserOrganizationsAction(),
        getActiveOrganizationId(),
      ]);
      setState({ status: "loaded", organizations, activeOrgId });
    } catch {
      setState({ status: "error", message: "Erro ao carregar organizações." });
    }
  }

  const activeOrganization =
    state.status === "loaded"
      ? (state.organizations.find((org) => org.id === state.activeOrgId) ??
        state.organizations.at(0))
      : undefined;

  const handleSwitch = useCallback(
    async (organizationId: string) => {
      setOpen(false);
      const formData = new FormData();
      formData.set("organizationId", organizationId);
      await setActiveOrganization(formData);
      router.refresh();
    },
    [router],
  );

  if (state.status === "loading") {
    return (
      <div className="flex h-10 w-full items-center gap-2 rounded-lg px-2">
        <div className="size-2 animate-pulse rounded-full bg-sidebar-foreground/30" />
        <span className="text-sidebar-foreground/50 text-xs">A carregar...</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-10 w-full items-center gap-2 rounded-lg px-2">
        <span className="text-sidebar-foreground/50 text-xs">{state.message}</span>
      </div>
    );
  }

  if (state.organizations.length <= 1) {
    const name = state.organizations.at(0)?.name ?? "Sem organização";
    return (
      <div className="flex h-10 w-full items-center gap-3 rounded-lg px-2">
        <Avatar className="size-7 rounded-md">
          <AvatarFallback className="rounded-md bg-sidebar-primary/20 font-medium text-sidebar-primary text-[0.6rem]">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">{name}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-10 w-full items-center gap-3 rounded-lg px-2 text-left outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          type="button"
          aria-label="Selecionar organização"
          aria-expanded={open}
          aria-controls={`${id}-list`}
        >
          <Avatar className="size-7 shrink-0 rounded-md">
            <AvatarFallback className="rounded-md bg-sidebar-primary/20 font-medium text-sidebar-primary text-[0.6rem]">
              {activeOrganization?.name.slice(0, 2).toUpperCase() ?? "ST"}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {activeOrganization?.name ?? "Selecionar"}
          </span>
          <svg
            aria-hidden="true"
            className="size-3 shrink-0 text-sidebar-foreground/50 transition-transform data-[open=true]:rotate-180"
            data-open={open || undefined}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <title>Alternar organização</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1" side="right" sideOffset={8}>
        <div className="px-2 py-1.5 text-muted-foreground text-2xs uppercase tracking-uppercase">
          Organizações
        </div>
        <div className="flex flex-col gap-0.5" id={`${id}-list`} role="listbox">
          {state.organizations.map((org) => {
            const isActive = org.id === activeOrganization?.id;
            return (
              <button
                key={org.id}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-selected:bg-accent/60"
                onClick={() => handleSwitch(org.id)}
                role="option"
                aria-selected={isActive}
                type="button"
              >
                <Avatar className="size-7 shrink-0 rounded-md">
                  <AvatarFallback className="rounded-md bg-sidebar-primary/20 font-medium text-sidebar-primary text-[0.6rem]">
                    {org.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{org.name}</div>
                  <div className="truncate text-muted-foreground text-xs">{org.slug}</div>
                </div>
                {isActive && (
                  <svg
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <title>Ativa</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
