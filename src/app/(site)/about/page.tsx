import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import Statement from "@/components/about/Statement";
import VisionMission from "@/components/about/VisionMission";
import Values from "@/components/about/Values";
import WhyChooseUs from "@/components/about/WhyChooseUs";
import ClosingCta from "@/components/about/ClosingCta";
import { aboutPage } from "@/content/about";
import { getPageContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "American Lycetuff began in 1999 and now has 70+ campuses across Pakistan. Learn about our Swabi campus in Shahmansoor Township, our vision, mission and values, and why families choose us.",
};

export default async function AboutPage() {
  const c = await getPageContent(aboutPage);
  return (
    <>
      <AboutHero content={c.hero} />
      <OurStory content={c.story} />
      <Statement content={c.statement} />
      <VisionMission content={c.visionMission} />
      <Values content={c.values} />
      <WhyChooseUs content={c.why} />
      <ClosingCta content={c.cta} />
    </>
  );
}
