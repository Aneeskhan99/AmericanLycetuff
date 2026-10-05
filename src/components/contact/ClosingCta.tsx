import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import { Rich } from "@/components/site/Rich";
import CmsLink, { unoptimized } from "./CmsLink";
import type { ContactInfo } from "./info";
import { btnStrokedWhite, btnWhite } from "./ui";

type Props = { content: PageContent<typeof contactPage>["closing"]; info: ContactInfo };

export default function ClosingCta({ content: c, info }: Props) {
  return (
    <section aria-labelledby="contact-cta-heading" className="relative isolate overflow-hidden bg-navy-ink">
      <Image
        src={c.image.src}
        alt={c.image.alt}
        unoptimized={unoptimized(c.image.src)}
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,30,63,0.95)_0%,rgba(8,30,63,0.8)_60%,rgba(8,30,63,0.4)_100%)]"
      />
      <div className="frame gutter py-[64px] lg:flex lg:min-h-[640px] lg:flex-col lg:pb-[140px] lg:pt-[140px]">
        <div className="mx-auto w-full max-w-[1498px] text-center lg:text-left">
          <h2
            id="contact-cta-heading"
            className="text-[36px] font-bold leading-[40px] tracking-[-0.6545px] text-white lg:ml-[-4px] lg:text-[clamp(64px,5.73vw,110px)] lg:leading-[1.036] lg:tracking-[-2px]"
          >
            <Rich text={c.heading} />
          </h2>
          <div className="mt-[24px] flex flex-col gap-[12px] lg:mt-[44px] lg:flex-row lg:gap-[24px]">
            <a href={info.directionsHref} target="_blank" rel="noopener noreferrer" className={`${btnWhite} w-full lg:w-auto`}>
              {c.directionsLabel}
            </a>
            <CmsLink href={c.messageButton.href} className={`${btnStrokedWhite} w-full lg:w-auto`}>
              {c.messageButton.label}
            </CmsLink>
          </div>
        </div>
      </div>
    </section>
  );
}
