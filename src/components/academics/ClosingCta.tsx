import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { CmsLink, unoptimized } from "./ui";

type Content = PageContent<typeof academicsPage>["cta"];

export default function ClosingCta({ content: c }: { content: Content }) {
  return (
    <section aria-labelledby="academics-cta-title" className="relative overflow-hidden bg-navy-ink">
      {c.image.src && (
        <Image
          src={c.image.src}
          alt={c.image.alt}
          unoptimized={unoptimized(c.image.src)}
          fill
          quality={75}
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,30,63,0.76)_0%,rgba(8,30,63,0.62)_60%,rgba(8,30,63,0.32)_100%)]"
      />
      <div className="frame gutter relative">
        <div className="mx-auto flex min-h-[448px] w-full max-w-[1498px] flex-col items-center py-[64px] lg:min-h-0 text-center lg:items-start lg:pb-[189px] lg:pt-[140px] lg:text-left">
          <h2
            id="academics-cta-title"
            className="text-[36px] font-bold leading-[40px] tracking-[-0.375px] text-white lg:max-w-[clamp(700px,57.3vw,1100px)] lg:text-[clamp(64px,5vw,96px)] lg:leading-[1.0625] lg:tracking-[-1px]"
          >
            <Rich text={c.heading} />
          </h2>
          {(c.primary.label || c.secondary.label) && (
            <div className="mt-[24px] flex w-full flex-col gap-[12px] lg:mt-[48px] lg:w-auto lg:flex-row lg:items-start lg:gap-[24px]">
              {c.primary.label && (
                <CmsLink
                  href={c.primary.href}
                  className="flex justify-center bg-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-[21px] tracking-[1.9px] text-crimson transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {c.primary.label}
                </CmsLink>
              )}
              {c.secondary.label && (
                <CmsLink
                  href={c.secondary.href}
                  className="flex justify-center border-2 border-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-[21px] tracking-[1.9px] text-white transition-colors hover:bg-white hover:text-navy-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {c.secondary.label}
                </CmsLink>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
