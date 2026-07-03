"use client";

import { cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "../lib/utils.js";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  density: "comfortable" | "compact" | "operational";
};

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/* SidebarProvider                                                           */
/* -------------------------------------------------------------------------- */

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  density = "compact",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  density?: "comfortable" | "compact" | "operational";
}) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const nextOpen = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(nextOpen);
      } else {
        _setOpen(nextOpen);
      }
      /* biome-ignore lint/suspicious/noDocumentCookie: sidebar state persistence requires a client-side cookie for hydration continuity */
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${nextOpen}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const [openMobile, setOpenMobile] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue: SidebarContextValue = {
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
    density,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-provider"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          density === "compact" && "text-sm",
          density === "operational" && "text-xs",
          props.className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

SidebarProvider.displayName = "SidebarProvider";

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                   */
/* -------------------------------------------------------------------------- */

const sidebarVariants = cva(
  "flex flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
  {
    variants: {
      collapsible: {
        offcanvas: "",
        icon: "",
        none: "w-(--sidebar-width)",
      },
    },
    defaultVariants: {
      collapsible: "offcanvas",
    },
  },
);

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        data-sidebar="sidebar"
        data-mobile="true"
        className="fixed inset-0 z-overlay flex"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-background/80"
          onClick={() => setOpenMobile(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            "relative flex h-full w-(--sidebar-width-mobile) max-w-(--sidebar-width-mobile) flex-col bg-sidebar text-sidebar-foreground",
            side === "right" && "ml-auto",
            className,
          )}
          style={{ "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        >
          <div className="sr-only">
            <h2>Sidebar</h2>
            <p>Displays the mobile sidebar.</p>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="sidebar"
      data-sidebar="sidebar"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      className={cn("group peer hidden text-sidebar-foreground md:block", className)}
      {...props}
    >
      {/* Spacer — takes up the sidebar width in the flex layout */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-normal ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          (variant === "floating" || variant === "inset") &&
            "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4))]",
        )}
      />
      {/* Fixed sidebar UI */}
      <div
        data-slot="sidebar-container"
        className={cn(
          sidebarVariants({ collapsible }),
          "fixed inset-y-0 z-sticky hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-normal ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4)+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
        )}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "flex h-full w-full flex-col bg-sidebar",
            variant === "floating" && "rounded-lg border border-sidebar-border shadow-panel",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

Sidebar.displayName = "Sidebar";

/* -------------------------------------------------------------------------- */
/* SidebarTrigger                                                            */
/* -------------------------------------------------------------------------- */

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Alternar barra lateral"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted",
        className,
      )}
      {...props}
    >
      <PanelLeftIcon className="size-4" aria-hidden="true" />
    </button>
  );
}

SidebarTrigger.displayName = "SidebarTrigger";

/* -------------------------------------------------------------------------- */
/* SidebarRail                                                               */
/* -------------------------------------------------------------------------- */

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Alternar barra lateral"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Alternar barra lateral"
      className={cn(
        "absolute inset-y-0 right-0 z-sticky hidden w-1 cursor-col-resize bg-transparent transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:bg-sidebar-border group-data-[collapsible=icon]:flex md:flex",
        className,
      )}
      {...props}
    />
  );
}

SidebarRail.displayName = "SidebarRail";

/* -------------------------------------------------------------------------- */
/* SidebarHeader                                                             */
/* -------------------------------------------------------------------------- */

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col border-b border-sidebar-border", className)}
      {...props}
    />
  );
}

SidebarHeader.displayName = "SidebarHeader";

/* -------------------------------------------------------------------------- */
/* SidebarFooter                                                             */
/* -------------------------------------------------------------------------- */

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto border-t border-sidebar-border", className)}
      {...props}
    />
  );
}

SidebarFooter.displayName = "SidebarFooter";

/* -------------------------------------------------------------------------- */
/* SidebarContent                                                            */
/* -------------------------------------------------------------------------- */

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

SidebarContent.displayName = "SidebarContent";

/* -------------------------------------------------------------------------- */
/* SidebarGroup                                                              */
/* -------------------------------------------------------------------------- */

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("flex flex-col gap-1 px-2 py-2", className)}
      {...props}
    />
  );
}

SidebarGroup.displayName = "SidebarGroup";

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  const { density } = useSidebar();

  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "flex h-[var(--density-operational-control-height)] items-center px-2 text-sidebar-foreground/50 text-xs font-medium uppercase tracking-uppercase",
        density === "comfortable" && "h-[var(--density-comfortable-control-height)]",
        density === "operational" && "text-2xs",
        className,
      )}
      {...props}
    />
  );
}

SidebarGroupLabel.displayName = "SidebarGroupLabel";

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

SidebarGroupContent.displayName = "SidebarGroupContent";

/* -------------------------------------------------------------------------- */
/* SidebarMenu                                                               */
/* -------------------------------------------------------------------------- */

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-0.5", className)} {...props} />
  );
}

SidebarMenu.displayName = "SidebarMenu";

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("list-none", className)} {...props} />;
}

SidebarMenuItem.displayName = "SidebarMenuItem";

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  size = "default",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  size?: "default" | "sm" | "lg";
}) {
  const { density } = useSidebar();
  const Comp = asChild ? Slot.Root : "button";

  const sizeClasses = {
    default: cn(
      "h-[var(--density-compact-control-height)]",
      density === "compact" && "h-[var(--density-operational-control-height)]",
      density === "operational" && "h-[var(--density-operational-control-height)]",
    ),
    sm: cn(
      "h-[var(--density-operational-control-height)]",
      density === "compact" && "h-[var(--density-operational-control-height)]",
      density === "operational" && "h-[var(--density-operational-control-height)]",
    ),
    lg: cn(
      "h-[var(--density-row-height)]",
      density === "compact" && "h-[var(--density-comfortable-control-height)]",
      density === "operational" && "h-[var(--density-compact-control-height)]",
    ),
  };

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] duration-normal ease-linear group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

SidebarMenuButton.displayName = "SidebarMenuButton";

function SidebarMenuAction({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="sidebar-menu-action"
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

SidebarMenuAction.displayName = "SidebarMenuAction";

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      className={cn(
        "ml-auto flex size-5 items-center justify-center rounded-full bg-sidebar-primary/10 text-2xs font-semibold text-sidebar-primary",
        className,
      )}
      {...props}
    />
  );
}

SidebarMenuBadge.displayName = "SidebarMenuBadge";

function SidebarMenuSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn(
        "flex h-[var(--density-compact-control-height)] items-center gap-3 px-3",
        className,
      )}
      {...props}
    >
      <div className="size-4 rounded-md bg-sidebar-accent/50 animate-pulse" />
      <div className="h-3 flex-1 rounded-md bg-sidebar-accent/50 animate-pulse" />
    </div>
  );
}

SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

/* -------------------------------------------------------------------------- */
/* SidebarMenuSub                                                            */
/* -------------------------------------------------------------------------- */

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

SidebarMenuSub.displayName = "SidebarMenuSub";

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={cn("list-none", className)} {...props} />;
}

SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

function SidebarMenuSubButton({
  asChild = false,
  isActive = false,
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

/* -------------------------------------------------------------------------- */
/* SidebarSeparator                                                          */
/* -------------------------------------------------------------------------- */

function SidebarSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="sidebar-separator"
      className={cn("mx-2 border-sidebar-border", className)}
      {...props}
    />
  );
}

SidebarSeparator.displayName = "SidebarSeparator";

/* -------------------------------------------------------------------------- */
/* SidebarInset                                                              */
/* -------------------------------------------------------------------------- */

function SidebarInset({ className, children, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-panel md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}

SidebarInset.displayName = "SidebarInset";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  sidebarVariants,
  useSidebar,
};
