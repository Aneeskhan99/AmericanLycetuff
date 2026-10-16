import type { Metadata } from "next";
import AboutIntro from "@/components/home/AboutIntro";
import Admissions from "@/components/home/Admissions";
import Cambridge from "@/components/home/Cambridge";
import Contests from "@/components/home/Contests";
import DiscoverTabs from "@/components/home/DiscoverTabs";
import HeroCarousel from "@/components/home/HeroCarousel";
import Location from "@/components/home/Location";
import Numbers from "@/components/home/Numbers";
import { ScrollLineGroup } from "@/components/home/ScrollLines";
import Stages from "@/components/home/Stages";
import StatCards from "@/components/home/StatCards";
import StemLabs from "@/components/home/StemLabs";
import { homePage } from "@/content/home";
import { getPageContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: { absolute: "American Lycetuff Swabi Campus | Learn, Grow & Shine" },
  description:
    "American Lycetuff DNK STEM School, Swabi Campus: Play Group to SSC and Cambridge IGCSE / O Level, STEM and robotics labs, and admissions open for 2027–28 in Shahmansoor Township, Swabi.",
};

export default async function Home() {
  const c = await getPageContent(homePage);
  return (
    <>
      <HeroCarousel content={c.hero} />
      <StatCards content={c.stats} />
      {/* Vertical line draws through these two sections on scroll */}
      <ScrollLineGroup>
        <AboutIntro content={c.about} />
        <Stages content={c.stages} />
      </ScrollLineGroup>
      <Location content={c.location} />
      <Cambridge content={c.cambridge} />
      <Admissions content={c.admissions} />
      <StemLabs content={c.labs} />
      <Contests content={c.contests} />
      <Numbers content={c.numbers} />
      <DiscoverTabs content={c.discover} />
    </>
  );
}
