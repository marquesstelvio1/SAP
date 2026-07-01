"use server";

import { getUserOrganizations, verifyUserOrganizationAccess } from "@saptm/auth/server";
import { cookies } from "next/headers";

import { requirePlatformSession } from "./auth-session";

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
};

export async function getUserOrganizationsAction(): Promise<UserOrganization[]> {
  const platformSession = await requirePlatformSession("/sign-in");

  return getUserOrganizations(platformSession.viewer.id);
}

export async function getActiveOrganizationId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const value = cookieStore.get("saptm_active_org")?.value;

  return value;
}

export async function setActiveOrganization(formData: FormData): Promise<void> {
  const organizationId = formData.get("organizationId");

  if (typeof organizationId !== "string" || organizationId.length === 0) {
    return;
  }

  const platformSession = await requirePlatformSession("/sign-in");
  const hasAccess = await verifyUserOrganizationAccess(platformSession.viewer.id, organizationId);

  if (!hasAccess) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set("saptm_active_org", organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}
