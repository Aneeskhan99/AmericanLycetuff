import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageEditor from "@/components/admin/pages/PageEditor";
import { requireSession } from "@/lib/auth";
import { pageByKey } from "@/content";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const page = pageByKey((await params).key);
  return { title: page ? `Edit: ${page.title}` : "Pages" };
}

export default async function EditPagePage({ params }: { params: Promise<{ key: string }> }) {
  await requireSession(["administrator", "editor"]);
  const { key } = await params;
  if (!pageByKey(key)) notFound();
  return <PageEditor pageKey={key} />;
}
