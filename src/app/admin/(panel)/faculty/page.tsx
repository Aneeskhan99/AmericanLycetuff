import type { Metadata } from "next";
import FacultyScreen from "@/components/admin/faculty/FacultyScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Faculty & staff" };

export default async function FacultyAdminPage() {
  await requireSession(["administrator", "editor"]);
  return <FacultyScreen />;
}
