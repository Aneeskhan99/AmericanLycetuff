import AdmissionDates from "@/components/site/AdmissionDates";
import type { HomeContent } from "@/content/home";

type Content = HomeContent["admissions"];

/** "Admissions Open for 2027–28" key dates (Figma Section 56:5740 / Component 14). */
export default function Admissions({ content: c }: { content: Content }) {
  return (
    <AdmissionDates
      id="home-admissions-heading"
      eyebrow={c.eyebrow}
      heading={c.heading}
      body={c.body}
      dates={c.dates}
      button={c.button}
      tone="white"
    />
  );
}
