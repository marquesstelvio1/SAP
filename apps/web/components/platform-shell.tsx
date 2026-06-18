"use client";

import { Badge, Button, Separator, Sheet, SheetContent, SheetTrigger } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { authClient } from "../lib/auth-client";
import type { PlatformViewer } from "../lib/auth-session";
import type { ResolvedPlatformNavigationGroup } from "../lib/platform-navigation";

export type PlatformShellProps = {
  viewer: PlatformViewer;
  navigationGroups: readonly ResolvedPlatformNavigationGroup[];
  children: ReactNode;
};

export function PlatformShell({ viewer, navigationGroups, children }: PlatformShellProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    setIsSigningOut(true);

    await authClient.signOut();
    router.replace("/sign-in" as Route);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-sidebar-border border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <ShellBrand />
          <ShellNavigation navigationGroups={navigationGroups} pathname={pathname} />
          <ShellUserCard viewer={viewer} isSigningOut={isSigningOut} onSignOut={handleSignOut} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex items-center gap-3">
                <MobileNavigation
                  navigationGroups={navigationGroups}
                  pathname={pathname}
                  viewer={viewer}
                  isSigningOut={isSigningOut}
                  onSignOut={handleSignOut}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm tracking-[var(--tracking-heading)]">
                    SAPTM Platform
                  </span>
                  <span className="text-muted-foreground text-xs">
                    UI/Auth/App Shell Foundation
                  </span>
                </div>
              </div>
              <Badge variant={viewer.permissions.length > 0 ? "success" : "warning"}>
                {viewer.permissions.length > 0 ? "RBAC ativo" : "RBAC sem grants"}
              </Badge>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function ShellBrand() {
  return (
    <div className="flex h-20 items-center gap-3 border-sidebar-border border-b px-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary font-semibold text-sidebar-primary-foreground text-sm">
        ST
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold tracking-[var(--tracking-heading)]">SAPTM</span>
        <span className="text-sidebar-foreground/65 text-xs">Enterprise Logistics OS</span>
      </div>
    </div>
  );
}

function ShellNavigation({
  navigationGroups,
  pathname,
}: {
  navigationGroups: readonly ResolvedPlatformNavigationGroup[];
  pathname: string;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
      {navigationGroups.map((group) => (
        <div className="flex flex-col gap-2" key={group.label}>
          <span className="px-2 font-medium text-[0.68rem] text-sidebar-foreground/55 uppercase tracking-[0.16em]">
            {group.label}
          </span>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <NavigationLink item={item} key={item.label} pathname={pathname} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function NavigationLink({
  item,
  pathname,
}: {
  item: ResolvedPlatformNavigationGroup["items"][number];
  pathname: string;
}) {
  const isActive = item.href === pathname || item.href.startsWith(`${pathname}#`);
  const content = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span>{item.label}</span>
        {item.allowed ? null : <span className="text-[0.65rem] text-warning">RBAC</span>}
      </span>
      <span className="line-clamp-2 text-sidebar-foreground/55 text-xs">{item.description}</span>
    </>
  );
  const className = [
    "flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/82 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
    item.allowed ? "" : "opacity-60",
  ]
    .filter(Boolean)
    .join(" ");

  if (!item.allowed) {
    return (
      <span aria-disabled="true" className={className}>
        {content}
      </span>
    );
  }

  return (
    <Link className={className} href={item.href as Route}>
      {content}
    </Link>
  );
}

function ShellUserCard({
  viewer,
  isSigningOut,
  onSignOut,
}: {
  viewer: PlatformViewer;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="border-sidebar-border border-t p-4">
      <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary/20 font-medium text-sidebar-primary text-xs">
            {viewer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{viewer.name}</p>
            <p className="truncate text-sidebar-foreground/60 text-xs">{viewer.email}</p>
          </div>
        </div>
        <Button
          disabled={isSigningOut}
          onClick={onSignOut}
          size="sm"
          type="button"
          variant="secondary"
        >
          {isSigningOut ? "A terminar..." : "Terminar sessão"}
        </Button>
      </div>
    </div>
  );
}

function MobileNavigation({
  navigationGroups,
  pathname,
  viewer,
  isSigningOut,
  onSignOut,
}: {
  navigationGroups: readonly ResolvedPlatformNavigationGroup[];
  pathname: string;
  viewer: PlatformViewer;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden" size="sm" type="button" variant="outline">
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent
        className="flex flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground"
        side="left"
      >
        <ShellBrand />
        <ShellNavigation navigationGroups={navigationGroups} pathname={pathname} />
        <Separator className="bg-sidebar-border" />
        <ShellUserCard viewer={viewer} isSigningOut={isSigningOut} onSignOut={onSignOut} />
      </SheetContent>
    </Sheet>
  );
}
