import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import FaqAccordion, { type FaqItem } from "./FaqAccordion";
import { Container, SectionHeading, sectionX } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["faq"] };

export default function Faq({ content: c }: Props) {
  const faqs: FaqItem[] = c.items.filter((item) => item.q.trim()).map((item) => ({ q: item.q, a: item.a }));

  return (
    <section aria-labelledby="faq-title" className={`bg-white py-14 lg:py-[130px] ${sectionX}`}>
      <Container className="lg:flex lg:items-start">
        <SectionHeading id="faq-title" eyebrow={c.eyebrow} heading={c.heading} compact className="lg:min-w-0 lg:max-w-[520px] lg:flex-1" />
        {faqs.length > 0 && (
          <div className="mt-8 lg:ml-auto lg:mt-0 lg:w-[56.68%] lg:max-w-[849px] lg:shrink-0">
            <FaqAccordion items={faqs} />
          </div>
        )}
      </Container>
    </section>
  );
}
