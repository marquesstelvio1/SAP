"use server";

import type { PlatformPermission } from "@saptm/auth";
import { notificationMarkReadInputSchema } from "@saptm/rpc";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformSession } from "../../../../lib/auth-session";
import { markNotificationRead } from "../../../../lib/notifications";

const readNotificationPermission: PlatformPermission = "notification.read";

export async function markNotificationReadFormAction(formData: FormData): Promise<void> {
  const platformSession = await requirePlatformSession("/app/notifications");

  if (!platformSession.viewer.permissions.includes(readNotificationPermission)) {
    redirect("/app/notifications?status=unread&limit=50&notificationError=forbidden");
  }

  const parsedInput = notificationMarkReadInputSchema.safeParse({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
  });

  if (!parsedInput.success) {
    redirect("/app/notifications?status=unread&limit=50&notificationError=invalid");
  }

  const result = await markNotificationRead(parsedInput.data);

  if (result.status !== "ok") {
    redirect(`/app/notifications?status=unread&limit=50&notificationError=${result.status}`);
  }

  revalidatePath("/app/notifications");
  redirect("/app/notifications?status=read&limit=50");
}
