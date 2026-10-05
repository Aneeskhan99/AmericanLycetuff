import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import { Rich } from "@/components/site/Rich";
import CmsLink, { unoptimized } from "./CmsLink";
import type { ContactInfo } from "./info";
import { btnCrimson, btnStrokedNavy } from "./ui";

type Props = { content: PageContent<typeof contactPage>["hero"]; info: ContactInfo };

export default function ContactHero({ content: c, info }: Props) {
  return (
    <section aria-labelledby="contact-hero-heading" className="bg-white">
      <div className="frame gutter py-[56px] lg:py-[80px]">
        <div className="mx-auto flex max-w-[1498px] flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-[40px]">
          {/* Text column */}
          <div className="flex w-full min-w-0 flex-col items-center text-center lg:mb-[46px] lg:max-w-[700px] lg:items-start lg:text-left">
            <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-crimson lg:text-[17.13px] lg:leading-normal lg:tracking-[1.9px]">
              {c.eyebrow}
            </p>
            <h1
              id="contact-hero-heading"
              className="mt-[32px] text-[36px] font-bold capitalize leading-[40px] text-navy lg:mt-[30px] lg:ml-[-4px] lg:text-[clamp(52px,3.65vw,70px)] lg:leading-[1.2958]"
            >
              <Rich text={c.heading} />
            </h1>
            <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.36px] text-[#5c5c5c] lg:mt-[17px] lg:max-w-[520px] lg:text-[20px] lg:leading-[32px] lg:tracking-[0.4px]">
              {c.intro}
            </p>
            <div className="mt-[24px] flex w-full flex-col gap-[12px] lg:mt-[64px] lg:w-auto lg:flex-row lg:flex-wrap lg:gap-[20px]">
              <CmsLink href={c.messageButton.href} className={`${btnCrimson} w-full lg:w-auto`}>
                {c.messageButton.label}
              </CmsLink>
              <a href={info.phoneHref} className={`${btnStrokedNavy} w-full lg:w-auto`}>
                {c.callPrefix} {info.phone}
              </a>
            </div>
          </div>

          {/* Photo with crimson accent block (accent is desktop only) */}
          <div className="relative mt-[26px] w-full lg:mt-0 lg:mr-[-20px] lg:aspect-[820/700] lg:w-[54.74%] lg:shrink-0">
            <div aria-hidden className="absolute bottom-0 left-0 hidden h-[calc(100%-20px)] w-[calc(100%-20px)] bg-crimson lg:block" />
            <div className="relative h-[291px] w-full border-[6px] border-[#fd0] lg:absolute lg:right-0 lg:top-0 lg:h-[calc(100%-20px)] lg:w-[calc(100%-20px)]">
              <Image
                src={c.image.src}
                alt={c.image.alt}
                unoptimized={unoptimized(c.image.src)}
                fill
                preload
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
