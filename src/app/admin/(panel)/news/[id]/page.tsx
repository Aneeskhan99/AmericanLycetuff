import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/news/PostEditor";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["administrator", "editor", "author"]);
  const { id } = await params;
  if (!/^[1-9]\d{0,15}$/.test(id)) notFound();
  return <PostEditor postId={Number(id)} />;
}
