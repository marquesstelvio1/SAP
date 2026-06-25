import type { Route } from "next";
import { redirect } from "next/navigation";

import { getCurrentPlatformSession } from "../../lib/auth-session";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession !== undefined) {
    redirect("/app" as Route);
  }

  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  if (token === undefined || token.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-semibold text-2xl tracking-tight">Link inválido</h1>
          <p className="text-muted-foreground text-sm">
            O link de redefinição de password é inválido ou está expirado. Solicite um novo link.
          </p>
          <a className="text-primary underline-offset-4 hover:underline" href="/forgot-password">
            Solicitar novo link
          </a>
        </div>
      </main>
    );
  }

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
              Redefinição segura
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="font-semibold text-4xl tracking-tight">Defina uma nova password.</h1>
              <p className="text-sidebar-foreground/70 text-lg leading-8">
                Escolha uma password forte para proteger a sua conta. Após redefinir, será
                redirecionado para o login.
              </p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-3 text-xs">
            {["12+ caracteres", "Encriptação", "Renovação de sessão"].map((item) => (
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
          <ResetPasswordForm token={token} />
        </section>
      </div>
    </main>
  );
}
