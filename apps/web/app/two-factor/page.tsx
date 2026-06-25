import type { Route } from "next";
import { redirect } from "next/navigation";

import { TwoFactorVerificationForm } from "../../components/auth/two-factor-verification-form";
import { getCurrentPlatformSession } from "../../lib/auth-session";

export const dynamic = "force-dynamic";

type TwoFactorPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function TwoFactorPage({ searchParams }: TwoFactorPageProps) {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession !== undefined) {
    redirect("/app" as Route);
  }

  const params = await searchParams;
  const nextPath = readSafeNextPath(params.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground md:p-8">
      <TwoFactorVerificationForm nextPath={nextPath} />
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
