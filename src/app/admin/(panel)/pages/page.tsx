import type { Metadata } from "next";
import PagesScreen from "@/components/admin/pages/PagesScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesPage() {
  await requireSession(["administrator", "editor"]);
  return <PagesScreen />;
}
