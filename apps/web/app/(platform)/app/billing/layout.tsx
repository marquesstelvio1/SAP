import { Tabs, TabsList, TabsTrigger } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type BillingTab = {
  label: string;
  href: string;
};

const billingTabs: BillingTab[] = [
  { label: "Visão geral", href: "/app/billing" },
  { label: "Subscrição", href: "/app/billing/subscription" },
  { label: "Faturas", href: "/app/billing/invoices" },
];

/**
 * Layout de facturação com navegação por tabs.
 * URL: /app/billing/*
 *
 * Tabs:
 * - Visão geral (overview)
 * - Subscrição (planos, upgrade/downgrade)
 * - Faturas (lista paginada)
 */
export default async function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-heading">Faturação</h1>
        <p className="text-muted-foreground text-sm">Subscrição, planos e faturas da organização</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          {billingTabs.map((tab) => (
            <Link key={tab.href} href={tab.href as Route}>
              <TabsTrigger
                value={tab.href === "/app/billing" ? "overview" : (tab.href.split("/").pop() ?? "")}
              >
                {tab.label}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>

      <div>{children}</div>
    </div>
  );
}
