import type { Metadata } from "next";
import EnquireHero from "@/components/enquire/EnquireHero";
import EnquirySection from "@/components/enquire/EnquirySection";
import { contactInfo } from "@/components/contact/info";
import { enquirePage } from "@/content/enquire";
import { getPageContent } from "@/lib/content-server";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Enquire Now",
  description:
    "Start your child's journey at American Lycetuff Swabi. Tell us about your child and we'll call you back about programmes, fees and a campus visit.",
};

export default async function EnquirePage() {
  const [content, settings] = await Promise.all([getPageContent(enquirePage), getSettings()]);
  return (
    <>
      <EnquireHero content={content.hero} />
      <EnquirySection content={content.side} info={contactInfo(settings)} />
    </>
  );
}
