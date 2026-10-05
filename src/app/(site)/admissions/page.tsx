import type { Metadata } from "next";
import Hero from "@/components/admissions/Hero";
import AdmissionProcess from "@/components/admissions/AdmissionProcess";
import GradesGuide from "@/components/admissions/GradesGuide";
import DocumentsRequired from "@/components/admissions/DocumentsRequired";
import Fees from "@/components/admissions/Fees";
import KeyDates from "@/components/admissions/KeyDates";
import Faq from "@/components/admissions/Faq";
import ClosingCta from "@/components/admissions/ClosingCta";
import { admissionsPage } from "@/content/admissions";
import { getPageContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "Admissions 2027-28",
  description:
    "Admissions are open for 2027-28 at American Lycetuff Swabi. Four simple steps, ages 3 to 16 from Play Group to Senior School, the documents you need, transparent fees, key dates and FAQs.",
};

export default async function AdmissionsPage() {
  const c = await getPageContent(admissionsPage);
  return (
    <>
      <Hero content={c.hero} />
      <AdmissionProcess content={c.process} />
      <GradesGuide content={c.grades} />
      <DocumentsRequired content={c.documents} />
      <Fees content={c.fees} />
      <KeyDates content={c.dates} />
      <Faq content={c.faq} />
      <ClosingCta content={c.cta} />
    </>
  );
}
