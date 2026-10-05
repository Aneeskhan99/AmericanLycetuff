import type { Metadata } from "next";
import EnquiriesScreen from "@/components/admin/enquiries/EnquiriesScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  await requireSession(["administrator", "editor"]);
  return <EnquiriesScreen />;
}
