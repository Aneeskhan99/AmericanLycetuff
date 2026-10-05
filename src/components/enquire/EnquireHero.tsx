import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { enquirePage } from "@/content/enquire";
import { Rich } from "@/components/site/Rich";
import { unoptimized } from "@/components/contact/CmsLink";

type Props = { content: PageContent<typeof enquirePage>["hero"] };

export default function EnquireHero({ content: c }: Props) {
  return (
    <section aria-labelledby="enquire-hero-heading" className="relative isolate overflow-hidden bg-navy-ink">
      <Image
        src={c.image.src}
        alt={c.image.alt}
        unoptimized={unoptimized(c.image.src)}
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,30,63,0.96)_0%,rgba(8,30,63,0.82)_55%,rgba(8,30,63,0.45)_100%)]"
      />
      <div className="frame gutter py-[64px] lg:min-h-[620px] lg:pb-[245px] lg:pt-[128px]">
        <div className="mx-auto flex max-w-[1498px] flex-col items-center text-center text-white lg:items-start lg:text-left">
          <div aria-hidden className="hidden h-[6px] w-[120px] bg-crimson lg:block" />
          <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:mt-[16px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]">
            {c.eyebrow}
          </p>
          <h1
            id="enquire-hero-heading"
            className="mt-[14px] text-[36px] font-bold capitalize leading-[40px] lg:mt-[31px] lg:max-w-[1000px] lg:text-[clamp(52px,3.65vw,70px)] lg:leading-[1.2958]"
          >
            <Rich text={c.heading} />
          </h1>
          <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.36px] lg:mt-[22px] lg:max-w-[700px] lg:text-[20px] lg:leading-[32px] lg:tracking-[0.4px]">
            {c.intro}
          </p>
        </div>
      </div>
    </section>
  );
}
