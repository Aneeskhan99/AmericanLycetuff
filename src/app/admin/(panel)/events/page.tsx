import type { Metadata } from "next";
import EventsScreen from "@/components/admin/events/EventsScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Events" };

export default async function Page() {
  await requireSession(["administrator", "editor"]);
  return <EventsScreen />;
}
