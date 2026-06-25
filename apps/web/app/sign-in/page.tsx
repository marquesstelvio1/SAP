import type { Route } from "next";
import { redirect } from "next/navigation";

import { getCurrentPlatformSession } from "../../lib/auth-session";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession !== undefined) {
    redirect("/app" as Route);
  }

  const params = await searchParams;
  const nextPath = readSafeNextPath(params.next);

  return (
    <main className="min-h-screen bg-sidebar text-sidebar-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden border-sidebar-border border-r p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,var(--sidebar-accent)/0.26,transparent_32%),radial-gradient(circle_at_80%_10%,var(--sidebar-primary)/0.18,transparent_28%)]" />
          <div className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
              ST
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold tracking-tight">SAPTM</span>
              <span className="text-sidebar-foreground/65 text-sm">Enterprise Logistics OS</span>
            </div>
          </div>
          <div className="relative flex max-w-xl flex-col gap-6">
            <div className="inline-flex w-fit rounded-full border border-sidebar-border bg-sidebar-accent/40 px-3 py-1 text-sidebar-foreground/72 text-xs">
              Foundation before business features
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="font-semibold text-4xl tracking-tight">
                Acesso seguro antes de qualquer operação logística.
              </h1>
              <p className="text-sidebar-foreground/70 text-lg leading-8">
                O shell autenticado, RBAC, Design System e observabilidade local fecham a base antes
                de tracking, cargas, portos ou analytics.
              </p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-3 text-xs">
            {["Better Auth", "RBAC/ABAC", "Audit-ready"].map((item) => (
              <div
                className="rounded-xl border border-sidebar-border bg-sidebar-accent/35 p-3"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center bg-background p-4 text-foreground md:p-8">
          <SignInForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}

function readSafeNextPath(value: string | string[] | undefined): string {
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (nextPath === undefined || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/app";
  }

  return nextPath;
}
