import type { Metadata } from "next";
import MediaScreen from "@/components/admin/media/MediaScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireSession(["administrator", "editor", "author"]);
  return <MediaScreen />;
}
