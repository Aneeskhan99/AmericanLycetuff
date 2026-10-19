import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { enquirePage } from "@/content/enquire";
import { Rich } from "@/components/site/Rich";
import { unoptimized } from "@/components/contact/CmsLink";
import type { ContactInfo } from "@/components/contact/info";
import EnquiryForm from "./EnquiryForm";

type Props = { content: PageContent<typeof enquirePage>["side"]; info: ContactInfo };

export default function EnquirySection({ content: c, info }: Props) {
  const assurances = c.assurances.map((a) => a.text).filter((t) => t.trim());
  return (
    <section aria-label="Enquiry form" className="bg-[#f8f8f8]">
      <div className="frame gutter py-[56px] lg:pb-[128.5px] lg:pt-0">
        {/* On desktop the card and side panel overlap the hero by 171.5px */}
        <div className="relative z-10 mx-auto flex max-w-[1498px] flex-col lg:mt-[-171.5px] lg:flex-row lg:items-start lg:gap-[clamp(28px,2.5vw,48px)]">
          {/* Form card */}
          <div className="w-full bg-white p-[24px] shadow-[0_24px_30px_rgba(0,0,0,0.1)] lg:relative lg:max-w-[980px] lg:px-[clamp(32px,2.92vw,56px)] lg:pb-[46px] lg:pt-[64px]">
            <div aria-hidden className="absolute inset-x-0 top-0 hidden h-[6px] bg-crimson lg:block" />
            <EnquiryForm />
          </div>

          {/* Side column */}
          <aside className="mt-[32px] flex w-full flex-col lg:mt-0 lg:w-[clamp(340px,24.5vw,470px)] lg:shrink-0">
            <div className="relative bg-navy p-[24px] text-white lg:px-[44px] lg:pb-[50px] lg:pt-[60px]">
              <div aria-hidden className="absolute inset-x-0 top-0 hidden h-[6px] bg-[#fd0] lg:block" />
              <h2 className="text-[30px] leading-[34px] lg:text-[clamp(36px,2.5vw,48px)] lg:leading-[1.1667]">
                <Rich text={c.heading} />
              </h2>

              <p className="mt-[16px] text-[13px] font-semibold uppercase leading-[20px] tracking-[2.7083px] text-[#fd0] lg:mt-[34px] lg:text-[12px] lg:leading-[15px] lg:tracking-[2.5px]">
                {c.phoneLabel}
              </p>
              <a
                href={info.phoneHref}
                data-als-site="contact"
                className="mt-[14px] inline-block text-[30px] font-bold leading-[34px] hover:text-[#fd0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:mt-[11px] lg:text-[clamp(34px,2.3vw,44px)] lg:leading-[53px]"
              >
                {info.phone}
              </a>
              <div aria-hidden className="mt-[7px] hidden h-[4px] w-[150px] bg-crimson lg:block" />

              {info.hoursLine && (
                <>
                  <p className="mt-[16px] text-[13px] font-semibold uppercase leading-[20px] tracking-[2.7083px] text-[#fd0] lg:mt-[36px] lg:text-[12px] lg:leading-[15px] lg:tracking-[2.5px]">
                    {c.hoursLabel}
                  </p>
                  <p data-als-site="hours" className="mt-[12px] text-[16px] leading-[25px] tracking-[0.2824px] lg:mt-[11px] lg:max-w-[380px] lg:text-[17px] lg:leading-[27px] lg:tracking-[0.3px]">
                    {info.hoursLine}
                  </p>
                </>
              )}

              <div aria-hidden className="mt-[28px] hidden h-px bg-white/25 lg:block" />

              {assurances.length > 0 && (
                <ul className="mt-[24px] flex flex-col gap-[10px] lg:mt-[35px] lg:gap-[34px]">
                  {assurances.map((a, i) => (
                    <li key={i} className="flex items-start gap-[12px] lg:items-center lg:gap-[14px]">
                      <span
                        aria-hidden
                        className="relative w-[15px] shrink-0 text-[16px] font-bold leading-[25px] lg:flex lg:size-[34px] lg:items-center lg:justify-center lg:text-[17px] lg:leading-none"
                      >
                        <Image
                          src="/images/enquire/check-circle.svg"
                          alt=""
                          width={34}
                          height={34}
                          className="absolute inset-0 hidden lg:block"
                        />
                        <span className="relative">✓</span>
                      </span>
                      <span className="text-[18px] font-medium leading-[28px] lg:text-[19px]">{a}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Photo with crimson accent (accent is desktop only) */}
            <div className="relative mt-[26px] lg:ml-[34px] lg:mt-[48px] lg:w-[calc(100%-50px)] lg:max-w-[446px] lg:aspect-[446/424]">
              <div aria-hidden className="absolute bottom-0 right-0 hidden h-[calc(100%-24px)] w-[calc(100%-26px)] bg-crimson lg:block" />
              <div className="relative h-[326px] w-full border-[6px] border-[#fd0] lg:absolute lg:left-0 lg:top-0 lg:h-[calc(100%-24px)] lg:w-[calc(100%-26px)]">
                <Image
                  src={c.image.src}
                  alt={c.image.alt}
                  unoptimized={unoptimized(c.image.src)}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            {c.caption && (
              <p className="mt-[20px] text-center text-[15px] font-medium leading-[23px] tracking-[0.3px] text-navy lg:ml-[34px] lg:mt-[81.5px] lg:text-left lg:leading-normal">
                {c.caption}
              </p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
