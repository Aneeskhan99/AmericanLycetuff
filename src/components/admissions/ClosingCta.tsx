import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Container, FilledButton, StrokedButton, sectionX, unoptimized } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["cta"] };

export default function ClosingCta({ content: c }: Props) {
  return (
    <section
      aria-labelledby="closing-cta-title"
      className={`relative min-h-[504px] overflow-hidden bg-navy-ink py-16 lg:flex lg:min-h-[720px] lg:pb-[120px] lg:pt-[130px] ${sectionX}`}
    >
      {c.background.src && (
        <Image
          src={c.background.src}
          alt={c.background.alt}
          unoptimized={unoptimized(c.background.src)}
          fill
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,30,63,0.95)_0%,rgba(8,30,63,0.8)_60%,rgba(8,30,63,0.4)_100%)]"
      />
      <Container className="relative flex flex-col items-center text-center text-white lg:items-start lg:text-left">
        <h2
          id="closing-cta-title"
          className="text-[36px] font-bold leading-[40px] tracking-[-0.6923px] lg:relative lg:-left-1 lg:max-w-[clamp(640px,54.1vw,1039px)] lg:text-[clamp(64px,5.42vw,104px)] lg:leading-[1.0385] lg:tracking-[-2px]"
        >
          <Rich text={c.heading} />
        </h2>
        {(c.primary.label || c.secondary.label) && (
          <div className="mt-6 flex w-full flex-col gap-3 lg:mt-11 lg:w-auto lg:flex-row lg:gap-6">
            {c.primary.label && (
              <FilledButton href={c.primary.href} className="w-full lg:w-auto">
                {c.primary.label}
              </FilledButton>
            )}
            {c.secondary.label && (
              <StrokedButton href={c.secondary.href} className="w-full lg:w-auto">
                {c.secondary.label}
              </StrokedButton>
            )}
          </div>
        )}
        {c.note && (
          <p className="mt-[26px] text-[16px] leading-[25px] tracking-[0.4px] lg:mt-9 lg:max-w-[640px] lg:leading-[26px]">{c.note}</p>
        )}
      </Container>
    </section>
  );
}
