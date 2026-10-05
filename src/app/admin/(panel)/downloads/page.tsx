import type { Metadata } from "next";
import DownloadsScreen from "@/components/admin/downloads/DownloadsScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Downloads" };

export default async function DownloadsAdminPage() {
  await requireSession(["administrator", "editor"]);
  return <DownloadsScreen />;
}
