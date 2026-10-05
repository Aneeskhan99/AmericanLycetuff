import type { Metadata } from "next";
import UsersScreen from "@/components/admin/UsersScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  await requireSession(["administrator"]);
  return <UsersScreen />;
}
