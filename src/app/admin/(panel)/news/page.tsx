import type { Metadata } from "next";
import PostsScreen from "@/components/admin/news/PostsScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "News & Blog" };

export default async function NewsAdminPage() {
  await requireSession(["administrator", "editor", "author"]);
  return <PostsScreen />;
}
