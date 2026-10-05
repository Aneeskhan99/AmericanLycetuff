import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ReachUs from "@/components/contact/ReachUs";
import ContactDetails from "@/components/contact/ContactDetails";
import OpeningHours from "@/components/contact/OpeningHours";
import GettingHere from "@/components/contact/GettingHere";
import ContactFormSection from "@/components/contact/ContactFormSection";
import ClosingCta from "@/components/contact/ClosingCta";
import { contactInfo } from "@/components/contact/info";
import { contactPage } from "@/content/contact";
import { getPageContent } from "@/lib/content-server";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "Contact Us",
    description: `Call ${s.contact.phone}, walk in Monday to Friday ${s.hours.weekdays}, or send us a message. American Lycetuff School, Swabi Campus, Shahmansoor Township, Swabi.`,
  };
}

export default async function ContactPage() {
  const [content, settings] = await Promise.all([getPageContent(contactPage), getSettings()]);
  const info = contactInfo(settings);
  return (
    <>
      <ContactHero content={content.hero} info={info} />
      <ReachUs content={content.reachUs} info={info} />
      <ContactDetails content={content.details} info={info} />
      <OpeningHours content={content.hours} info={info} />
      <GettingHere content={content.gettingHere} info={info} />
      <ContactFormSection content={content.form} />
      <ClosingCta content={content.closing} info={info} />
    </>
  );
}
