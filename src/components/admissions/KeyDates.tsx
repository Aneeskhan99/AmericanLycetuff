import AdmissionDates from "@/components/site/AdmissionDates";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";

type Props = { content: PageContent<typeof admissionsPage>["dates"] };

/** Figma: Admissions "Key Dates" 137:8282, the Home date cards on a #f8f8f8 page with a white band. */
export default function KeyDates({ content: c }: Props) {
  return (
    <AdmissionDates
      id="key-dates-title"
      eyebrow={c.eyebrow}
      heading={c.heading}
      body={c.body}
      dates={c.items}
      button={c.button}
      tone="grey"
    />
  );
}
