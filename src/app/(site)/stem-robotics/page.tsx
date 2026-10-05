import type { Metadata } from "next";
import ClosingCta from "@/components/stem/ClosingCta";
import Hero from "@/components/stem/Hero";
import Labs from "@/components/stem/Labs";
import MakingTesting from "@/components/stem/MakingTesting";
import Progress from "@/components/stem/Progress";
import WhyStem from "@/components/stem/WhyStem";
import { designUnit } from "@/components/stem/ui";
import { stemRoboticsPage } from "@/content/stem-robotics";
import { getPageContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "STEM & Robotics",
  description:
    "Learning by building at American Lycetuff Swabi: Robotics, Science and Computer & ICT laboratories where students make, test, fail and improve, from Primary through Senior years.",
};

export default async function StemRoboticsPage() {
  const c = await getPageContent(stemRoboticsPage);
  return (
    <div style={designUnit}>
      <Hero content={c.hero} />
      <WhyStem content={c.why} />
      <MakingTesting content={c.making} />
      <Labs content={c.labs} />
      <Progress content={c.progress} />
      <ClosingCta content={c.cta} />
    </div>
  );
}
