import type { Metadata } from "next";
import PostEditor from "@/components/admin/news/PostEditor";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireSession(["administrator", "editor", "author"]);
  return <PostEditor postId={null} />;
}
