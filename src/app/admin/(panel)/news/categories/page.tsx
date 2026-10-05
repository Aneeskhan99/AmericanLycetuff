import type { Metadata } from "next";
import CategoriesScreen from "@/components/admin/news/CategoriesScreen";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Categories & tags" };

export default async function NewsCategoriesPage() {
  await requireSession(["administrator", "editor"]);
  return <CategoriesScreen />;
}
