import type { Metadata } from "next";
import NoticesScreen from "@/components/admin/notices/NoticesScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Notices" };

export default async function Page() {
  await requireSession(["administrator", "editor"]);
  return <NoticesScreen />;
}
