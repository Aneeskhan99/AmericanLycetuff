import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";
import { CmsLink, unoptimized } from "./cms";

type Content = PageContent<typeof aboutPage>["cta"];

export default function ClosingCta({ content: c }: { content: Content }) {
  return (
    <section aria-labelledby="about-cta-heading" className="relative overflow-hidden bg-navy-ink">
      {c.image.src && (
        <Image
          src={c.image.src}
          alt={c.image.alt}
          unoptimized={unoptimized(c.image.src)}
          fill
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,30,63,0.95)_0%,rgba(8,30,63,0.75)_60%,rgba(8,30,63,0.35)_100%)]"
      />
      <div className="frame gutter relative flex min-h-[532px] flex-col justify-center py-[56px] lg:min-h-[760px] lg:justify-start lg:pb-[119px] lg:pt-[170px]">
        <div className="mx-auto flex w-full max-w-[1498px] flex-col items-center text-center text-white lg:items-start lg:text-left">
          <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]">
            {c.eyebrow}
          </p>
          <h2
            id="about-cta-heading"
            className="mt-[14px] text-[36px] font-bold leading-[40px] lg:mt-[20px] lg:max-w-[1000px] lg:text-[clamp(72px,5vw,96px)] lg:leading-[1.0625] lg:tracking-[-1px]"
          >
            <Rich text={c.heading} />
          </h2>
          <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.4px] lg:mt-[36px] lg:max-w-[620px] lg:text-[20px] lg:leading-[32px]">
            {c.text}
          </p>
          {c.button.label && (
            <CmsLink
              href={c.button.href}
              className="mt-[24px] flex w-full justify-center bg-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-normal tracking-[1.9px] text-crimson transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:mt-[44px] lg:w-auto"
            >
              {c.button.label}
            </CmsLink>
          )}
        </div>
      </div>
    </section>
  );
}
