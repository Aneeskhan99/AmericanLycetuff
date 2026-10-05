import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Container, FilledButton, sectionX, unoptimized } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["fees"] };

export default function Fees({ content: c }: Props) {
  return (
    <section aria-labelledby="fees-title" className={`bg-navy-ink py-14 lg:pb-[135px] lg:pt-[100px] ${sectionX}`}>
      <Container className="flex flex-col items-center text-center text-white lg:flex-row lg:items-start lg:gap-10 lg:text-left">
        <div className="flex w-full flex-col items-center lg:min-w-0 lg:flex-1 lg:items-start">
          <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:text-[13.1px] lg:leading-[normal] lg:tracking-[2px]">
            {c.eyebrow}
          </p>
          <h2
            id="fees-title"
            className="mt-3 text-[36px] font-bold leading-[40px] tracking-[-0.9px] lg:relative lg:-left-1 lg:mt-5 lg:max-w-[clamp(500px,41.67vw,800px)] lg:text-[clamp(80px,6.25vw,120px)] lg:leading-[1.0333] lg:tracking-[-3px]"
          >
            <Rich text={c.heading} />
          </h2>
          <p className="mt-4 text-[18px] leading-[28px] tracking-[0.36px] lg:mt-[30px] lg:max-w-[600px] lg:text-[20px] lg:leading-[32px] lg:tracking-[0.4px]">
            {c.body}
          </p>
          {c.button.label && (
            <FilledButton href={c.button.href} className="mt-6 w-full lg:mt-10 lg:w-auto">
              {c.button.label}
            </FilledButton>
          )}
        </div>
        <div className="relative mt-8 h-[308px] w-full shrink-0 border-[1.5px] border-solid border-white/40 lg:mt-[50px] lg:aspect-[660/440] lg:h-auto lg:w-[clamp(420px,34.375vw,660px)] lg:border-dashed">
          {c.image.src && (
            <Image
              src={c.image.src}
              alt={c.image.alt}
              unoptimized={unoptimized(c.image.src)}
              fill
              sizes="(min-width: 1024px) 660px, 100vw"
              className="object-cover"
            />
          )}
        </div>
      </Container>
    </section>
  );
}
