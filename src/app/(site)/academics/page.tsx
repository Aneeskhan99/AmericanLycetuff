import type { Metadata } from "next";
import Hero from "@/components/academics/Hero";
import Approach from "@/components/academics/Approach";
import Stages from "@/components/academics/Stages";
import Qualifications from "@/components/academics/Qualifications";
import BeyondTextbook from "@/components/academics/BeyondTextbook";
import ClosingCta from "@/components/academics/ClosingCta";
import { academicsPage } from "@/content/academics";
import { getPageContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "One pathway from Play Group to SSC and Cambridge IGCSE / O Level at American Lycetuff Swabi: four stages, two qualifications, and learning beyond the textbook.",
};

export default async function AcademicsPage() {
  const c = await getPageContent(academicsPage);
  return (
    <>
      <Hero content={c.hero} />
      <Approach content={c.approach} />
      <Stages content={c.stages} />
      <Qualifications content={c.qualifications} />
      <BeyondTextbook content={c.beyond} />
      <ClosingCta content={c.cta} />
    </>
  );
}
