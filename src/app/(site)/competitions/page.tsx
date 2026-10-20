import type { Metadata } from "next";
import { Categories, Cta, Featured, Hero, Recent, Steps } from "@/components/competitions/Sections";
import { competitionsPage } from "@/content/competitions";
import { getPageContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Where American Lycetuff Swabi students compete, achieve and shine: academic olympiads, STEM and robotics, speech and debate, arts and sports, plus our certificate ceremonies and award days.",
  alternates: { canonical: "/competitions" },
};

export default async function CompetitionsPage() {
  const c = await getPageContent(competitionsPage);
  return (
    <>
      <Hero content={c.hero} />
      <Categories content={c.categories} />
      <Featured content={c.featured} />
      <Recent content={c.recent} />
      <Steps content={c.steps} />
      <Cta content={c.cta} />
    </>
  );
}
