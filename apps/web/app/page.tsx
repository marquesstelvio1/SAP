import type { Route } from "next";
import { redirect } from "next/navigation";

import { getCurrentPlatformSession } from "../lib/auth-session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession === undefined) {
    redirect("/sign-in?next=/app" as Route);
  }

  redirect("/app" as Route);
}
