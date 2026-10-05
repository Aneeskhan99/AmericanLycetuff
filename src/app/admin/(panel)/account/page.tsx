import type { Metadata } from "next";
import AccountScreen from "@/components/admin/AccountScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  await requireSession();
  return <AccountScreen />;
}
