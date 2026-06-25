import type { Route } from "next";
import { redirect } from "next/navigation";

export default function SettingsIndex() {
  redirect("/app/settings/general" as Route);
}
