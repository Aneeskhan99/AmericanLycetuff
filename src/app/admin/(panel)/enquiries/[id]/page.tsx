import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EnquiryDetail from "@/components/admin/enquiries/EnquiryDetail";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["administrator", "editor"]);
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();
  return <EnquiryDetail id={Number(id)} />;
}
