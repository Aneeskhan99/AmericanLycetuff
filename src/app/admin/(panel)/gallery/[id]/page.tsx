import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlbumDetail from "@/components/admin/gallery/AlbumDetail";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Album" };

export default async function AlbumAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["administrator", "editor"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <AlbumDetail id={id} />;
}
