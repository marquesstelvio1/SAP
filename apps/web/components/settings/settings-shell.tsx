"use client";

import { Badge, Separator } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SettingsSection = {
  label: string;
  href: string;
  description: string;
  status: "active" | "coming-soon";
};

const settingsSections: readonly SettingsSection[] = [
  {
    label: "Geral",
    href: "/app/settings/general",
    description: "Nome, slug e estado da organização",
    status: "active",
  },
  {
    label: "Marca",
    href: "/app/settings/branding",
    description: "Logotipo, cores e favicon",
    status: "active",
  },
  {
    label: "Membros",
    href: "/app/admin/teams",
    description: "Gerir membros da organização",
    status: "active",
  },
  {
    label: "Funções",
    href: "/app/admin",
    description: "Gerir perfis e permissões",
    status: "active",
  },
  {
    label: "Equipas",
    href: "/app/admin/teams",
    description: "Agrupar membros em equipas",
    status: "active",
  },
  {
    label: "Faturação",
    href: "/app/settings/billing",
    description: "Planos, métodos de pagamento e faturas",
    status: "active",
  },
  {
    label: "Notificações",
    href: "/app/settings/webhooks",
    description: "Notificações HTTP para eventos da organização",
    status: "active",
  },
];

export type SettingsShellProps = {
  children: ReactNode;
  organizationName: string;
};

export function SettingsShell({ children, organizationName }: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 self-stretch border-r overflow-y-auto md:block">
        <div className="flex flex-col gap-1 p-4">
          <div className="mb-3 flex flex-col gap-0.5 px-3">
            <span className="font-semibold text-sm tracking-heading">Configurações</span>
            <span className="truncate text-muted-foreground text-xs">{organizationName}</span>
          </div>
          <Separator className="mb-3" />
          <nav className="flex flex-col gap-1">
            {settingsSections.map((section) => (
              <SettingsNavLink key={section.label} pathname={pathname} section={section} />
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6 lg:p-8">{children}</div>
    </div>
  );
}

function SettingsNavLink({ pathname, section }: { pathname: string; section: SettingsSection }) {
  const isActive = section.status === "active" && pathname.startsWith(section.href);
  const isParentActive = section.href === "/app/admin" && pathname.startsWith("/app/admin");
  const isHighlighted = isActive || isParentActive;

  if (section.status === "coming-soon") {
    return (
      <span
        className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-muted-foreground/60 opacity-60 transition-colors"
        aria-disabled="true"
      >
        <span>{section.label}</span>
        <Badge variant="outline" density="compact">
          Brevemente
        </Badge>
      </span>
    );
  }

  return (
    <Link
      href={section.href as Route}
      className={`flex flex-col gap-0.5 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
        isHighlighted
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      }`}
      aria-current={isHighlighted ? "page" : undefined}
    >
      <span className="font-medium">{section.label}</span>
      <span className="text-[0.7rem] text-muted-foreground/70">{section.description}</span>
    </Link>
  );
}
