import type { Metadata } from "next";
import AlbumsScreen from "@/components/admin/gallery/AlbumsScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Gallery albums" };

export default async function GalleryAdminPage() {
  await requireSession(["administrator", "editor"]);
  return <AlbumsScreen />;
}
