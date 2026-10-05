import type { Metadata } from "next";
import CalendarScreen from "@/components/admin/calendar/CalendarScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Academic calendar" };

export default async function Page() {
  await requireSession(["administrator", "editor"]);
  return <CalendarScreen />;
}
