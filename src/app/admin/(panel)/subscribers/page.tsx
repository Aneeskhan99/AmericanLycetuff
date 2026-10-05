import type { Metadata } from "next";
import SubscribersScreen from "@/components/admin/subscribers/SubscribersScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  await requireSession(["administrator", "editor"]);
  return <SubscribersScreen />;
}
