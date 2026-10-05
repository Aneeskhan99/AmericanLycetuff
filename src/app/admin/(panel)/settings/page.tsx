import type { Metadata } from "next";
import SettingsScreen from "@/components/admin/settings/SettingsScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireSession(["administrator"]);
  return <SettingsScreen />;
}
