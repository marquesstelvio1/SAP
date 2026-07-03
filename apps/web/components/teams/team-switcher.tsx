"use client";

import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from "@saptm/ui";
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useRpcQuery } from "../../hooks/use-rpc";
import { setActiveOrganization } from "../../lib/org-actions";
import { rpcGet } from "../../lib/rpc-client";

export type TeamItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount?: number;
};

export type TeamSwitcherProps = {
  /**
   * If true, the component fetches organizations via TanStack Query.
   * If false, uses static props (for server-provided data).
   */
  dynamic?: boolean;
  /** Static organizations (used when dynamic=false) */
  organizations?: TeamItem[];
  /** Currently active organization */
  activeOrganization?: TeamItem;
};

/**
 * Team/Organization switcher using TanStack Query.
 *
 * States:
 * - Single team: rendered as static display (no dropdown)
 * - Multiple teams: dropdown with search
 * - Loading: skeleton placeholder
 * - Error: inline error message
 * - Empty (no orgs): hidden (not rendered)
 *
 * Used for dynamic contexts where org list changes frequently.
 * For static sidebar usage, see `app-sidebar/team-switcher.tsx`.
 */
export function TeamSwitcher({
  dynamic = true,
  organizations: staticOrgs,
  activeOrganization: staticActiveOrg,
}: TeamSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // TanStack Query for dynamic fetching
  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useRpcQuery({
    queryKey: ["organizations", "list"],
    queryFn: async (): Promise<{ organizations: TeamItem[]; activeId: string | null }> => {
      const result = await rpcGet("/rpc/organization/list", {
        safeParse: (data: unknown) => {
          if (typeof data === "object" && data !== null && "organizations" in data) {
            return { success: true as const, data: data as { organizations: TeamItem[] } };
          }
          return { success: false as const };
        },
      } as never);
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      const data = result.data as { organizations: TeamItem[] };
      return {
        organizations: data.organizations,
        activeId: null, // Will be determined from cookie
      };
    },
    enabled: dynamic,
    staleTime: 60_000,
    retry: 2,
  });

  // Use static props when not dynamic
  const organizations = dynamic ? (queryData?.organizations ?? []) : (staticOrgs ?? []);
  const activeOrg = dynamic
    ? (organizations.find((o) => o.isActive) ?? organizations[0])
    : (staticActiveOrg ?? organizations[0]);

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

  // Hidden if no organizations
  if (!isLoading && organizations.length === 0) {
    return null;
  }

  // Single organization — static display, no dropdown
  if (!isLoading && organizations.length === 1 && activeOrg) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <BuildingIcon className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{activeOrg.name}</span>
          <span className="truncate text-xs text-muted-foreground">{activeOrg.slug}</span>
        </div>
        {activeOrg.memberCount !== undefined ? (
          <Badge variant="outline" density="compact">
            {activeOrg.memberCount}
          </Badge>
        ) : null}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <Skeleton className="size-8 rounded-lg" />
        <div className="grid flex-1 gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <BuildingIcon className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-destructive text-xs font-medium">Erro ao carregar</p>
          <p className="text-destructive/70 text-xs">
            {error?.message ?? "Organizações indisponíveis"}
          </p>
        </div>
      </div>
    );
  }

  // Multiple organizations — dropdown
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <BuildingIcon className="size-4 shrink-0" />
            <span className="truncate">{activeOrg?.name ?? "Selecionar organização"}</span>
          </div>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Procurar organização..." />
          <CommandList>
            <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
            <CommandGroup heading="Organizações">
              {organizations.map((org) => (
                <CommandItem key={org.id} value={org.id} onSelect={() => handleSwitch(org.id)}>
                  <BuildingIcon className="mr-2 size-4" />
                  <span className="flex-1">{org.name}</span>
                  <span className="mr-2 text-muted-foreground text-xs">{org.slug}</span>
                  {org.id === activeOrg?.id ? <CheckIcon className="size-4" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push("/app/admin");
                }}
              >
                <PlusIcon className="mr-2 size-4" />
                Criar organização
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
